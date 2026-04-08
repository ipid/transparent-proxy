import * as fs from 'node:fs'
import * as path from 'node:path'
import * as v from 'valibot'
import { assertNoDuplicatePathPrefixes, normalizePathPrefix, normalizeTarget } from './utils/config.ts'

// ---------- 原始 schema（JSON 文件直接对应的结构） ----------

const RawRouteSchema = v.object({
  pathPrefix: v.string(),
  target: v.pipe(v.string(), v.nonEmpty('target 必须是非空字符串'), v.url('target 必须是合法的 URL')),
})

const RawProxyEntrySchema = v.object({
  host: v.pipe(v.string(), v.nonEmpty('host 必须是非空字符串'), v.ip('host 必须是有效的 IPv4 或 IPv6 地址')),
  port: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(65535)),
  routes: v.pipe(v.array(RawRouteSchema), v.nonEmpty('routes 不能为空')),
  logDir: v.pipe(v.string(), v.nonEmpty('logDir 必须是非空字符串')),
})

const RawProxyConfigSchema = v.object({
  proxies: v.pipe(v.array(RawProxyEntrySchema), v.nonEmpty('proxies 不能为空')),
})

// ---------- 规范化后的类型 ----------

export interface NormalizedRoute {
  pathPrefix: string // 规范化后：以 "/" 开头，不以 "/" 结尾，或空字符串 ""
  target: URL // 规范化后的 URL（pathname 不以 "/" 结尾，除非只有 "/"）
}

export interface ProxyEntry {
  // 要监听的 ip 地址
  host: string
  // 要监听的端口号
  port: number
  // 在当前的 IP 地址/端口上，哪些请求应该被代理到哪里
  routes: NormalizedRoute[]
  // 发生请求的时候，请求内容会被记录到的目录
  logDir: string
}

export interface ProxyConfig {
  proxies: ProxyEntry[]
}

// ---------- 主验证函数 ----------

export function validateConfig(raw: unknown): ProxyConfig {
  const parsed = v.parse(RawProxyConfigSchema, raw)

  const ports = new Set<number>()
  const proxies: ProxyEntry[] = []

  for (let i = 0; i < parsed.proxies.length; i++) {
    const entry = parsed.proxies[i]
    const currJsonPath = `proxies[${i}]`

    if (ports.has(entry.port)) {
      throw new Error(`端口 ${entry.port} 重复配置：不允许 proxies 中的多个条目使用相同的端口号。`)
    }
    ports.add(entry.port)

    // 规范化 routes
    const routes: NormalizedRoute[] = entry.routes.map((route, routeIndex) => ({
      pathPrefix: normalizePathPrefix(route.pathPrefix),
      target: normalizeTarget(route.target, `${currJsonPath}.routes[${routeIndex}]`),
    }))

    // 进行规范化之后，前缀不能重复；具体匹配优先级由最长前缀规则决定
    assertNoDuplicatePathPrefixes(
      routes.map((route) => route.pathPrefix),
      `${currJsonPath}.routes`,
    )

    // 确保 logDir 存在
    fs.mkdirSync(path.resolve(entry.logDir), { recursive: true })

    proxies.push({
      host: entry.host,
      port: entry.port,
      routes,
      logDir: entry.logDir,
    })
  }

  return { proxies }
}
