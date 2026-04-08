import * as fs from 'node:fs'
import * as path from 'node:path'
import { Command } from 'commander'
import type { ProxyConfig } from './config.ts'
import { validateConfig } from './config.ts'
import { startProxy } from './proxy.ts'

const program = new Command()

program
  .name('transparent-proxy')
  .description('透明 HTTP 转发代理服务器，支持流式日志记录')
  .requiredOption('-c, --config <path>', '配置文件路径（JSON 格式）')
  .parse()

const opts = program.opts<{ config: string }>()
const configPath = path.resolve(opts.config)
console.log(`正在加载配置: ${configPath}`)

let rawConfig: unknown
try {
  const text = fs.readFileSync(configPath, 'utf-8')
  rawConfig = JSON.parse(text)
} catch (err) {
  console.error(`无法加载配置文件，或配置文件不符合 JSON 语法: ${configPath}`)
  console.error(err instanceof Error ? err.message : String(err))
  console.error(`请检查配置文件内容是否正确。`)
  process.exit(1)
}

let config: ProxyConfig
try {
  config = validateConfig(rawConfig)
} catch (err) {
  console.error('配置验证失败:')
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
}

for (const entry of config.proxies) {
  startProxy(entry)
}
