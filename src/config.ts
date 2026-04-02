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

export interface RawProxyEntry {
  port: number
  routes: NormalizedRoute[]
  logDir: string
}

export interface ProxyConfig {
  proxies: RawProxyEntry[]
}

// ---------- 主验证函数 ----------

export function validateConfig(raw: unknown): ProxyConfig {
  const parsed = v.parse(RawProxyConfigSchema, raw)

  const ports = new Set<number>()
  const proxies: RawProxyEntry[] = []

  for (let i = 0; i < parsed.proxies.length; i++) {
    const entry = parsed.proxies[i]
    const p = `proxies[${i}]`

    if (ports.has(entry.port)) {
      throw new Error(`端口 ${entry.port} 重复配置`)
    }
    ports.add(entry.port)

    // 规范化 routes
    const routes: NormalizedRoute[] = entry.routes.map((r, j) => ({
      pathPrefix: normalizePathPrefix(r.pathPrefix),
      target: normalizeTarget(r.target, `${p}.routes[${j}]`),
    }))

    // 规范化后前缀不能重复；具体匹配优先级由最长前缀规则决定
    assertNoDuplicatePathPrefixes(
      routes.map((route) => route.pathPrefix),
      `${p}.routes`,
    )

    // 确保 logDir 存在
    fs.mkdirSync(path.resolve(entry.logDir), { recursive: true })

    proxies.push({
      port: entry.port,
      routes,
      logDir: entry.logDir,
    })
  }

  return { proxies }
}
