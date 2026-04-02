import * as http from 'node:http'
import * as https from 'node:https'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { RawProxyEntry } from './config.ts'
import { buildUpstreamHeaders, buildUpstreamPath, getDisplayUrl, matchRoute } from './utils/proxy.ts'
import { formatTimestamp } from './utils/time.ts'

function handleRequest(entry: RawProxyEntry, req: http.IncomingMessage, res: http.ServerResponse): void {
  const reqUrl = req.url ?? '/'

  const route = matchRoute(entry.routes, reqUrl)
  if (!route) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('未找到匹配的代理路由')
    return
  }

  const targetBase = route.target

  // 构建上游请求路径
  const upstreamPath = buildUpstreamPath(targetBase.pathname, route.pathPrefix, reqUrl)
  const displayUrl = getDisplayUrl(targetBase, upstreamPath)

  // 创建日志文件
  const logDir = path.resolve(entry.logDir)
  fs.mkdirSync(logDir, { recursive: true })
  const logFile = path.join(logDir, `${formatTimestamp()}-${Math.random().toString(36).slice(2)}.log`)
  const log = fs.createWriteStream(logFile)
  log.on('error', (err) => {
    console.error(`[日志写入失败] ${logFile}: ${err.message}`)
  })

  // 写入请求元信息
  const clientIp = req.socket.remoteAddress ?? 'unknown'
  log.write(`[${new Date().toISOString()}] ${clientIp} → ${displayUrl}\n\n`)
  log.write('>>>>>>>>>> Request >>>>>>>>>>\n\n')
  log.write(`${req.method ?? 'GET'} ${reqUrl} HTTP/${req.httpVersion}\n`)
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    log.write(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\n`)
  }
  log.write('\n')

  const headers = buildUpstreamHeaders(req.headers, targetBase)

  const requestOptions: http.RequestOptions = {
    hostname: targetBase.hostname,
    port: targetBase.port !== '' ? Number(targetBase.port) : undefined,
    path: upstreamPath,
    method: req.method,
    headers,
  }

  function onResponse(upstreamRes: http.IncomingMessage): void {
    log.write('\n\n<<<<<<<<<< Response <<<<<<<<<<\n\n')
    log.write(`HTTP/${upstreamRes.httpVersion} ${upstreamRes.statusCode ?? 0} ${upstreamRes.statusMessage ?? ''}\n`)
    for (let i = 0; i < upstreamRes.rawHeaders.length; i += 2) {
      log.write(`${upstreamRes.rawHeaders[i]}: ${upstreamRes.rawHeaders[i + 1]}\n`)
    }
    log.write('\n')

    res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)

    upstreamRes.on('data', (chunk: Buffer) => {
      log.write(chunk)
      res.write(chunk)
    })
    upstreamRes.on('end', () => {
      log.end()
      res.end()
    })
  }

  const upstreamReq =
    targetBase.protocol === 'https:'
      ? https.request(requestOptions, onResponse)
      : http.request(requestOptions, onResponse)

  req.on('data', (chunk: Buffer) => {
    log.write(chunk)
    upstreamReq.write(chunk)
  })
  req.on('end', () => {
    upstreamReq.end()
  })

  upstreamReq.on('error', (err) => {
    log.write('\n<<<<<<<<<< Error <<<<<<<<<<\n')
    log.write(err.message + '\n')
    log.end()
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
    }
    res.end(`上游请求失败: ${err.message}`)
  })
}

export function startProxy(entry: RawProxyEntry): http.Server {
  const server = http.createServer((req, res) => {
    handleRequest(entry, req, res)
  })

  server.on('error', (err) => {
    console.error(`代理启动失败，端口 ${entry.port} 无法监听: ${err.message}`)
    process.exit(1)
  })

  server.listen(entry.port, '0.0.0.0', () => {
    for (const route of entry.routes) {
      const prefix = route.pathPrefix || '/'
      console.log(`[proxy] 0.0.0.0:${entry.port}${prefix} → ${route.target.origin}${route.target.pathname}`)
    }
  })

  return server
}
