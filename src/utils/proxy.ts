import * as http from 'node:http'

const REQUEST_URL_BASE = 'http://transparent-proxy.local'

interface RouteLike {
  pathPrefix: string
}

function parseRequestUrl(reqUrl: string): URL {
  return new URL(reqUrl, REQUEST_URL_BASE)
}

function matchesPathPrefix(pathname: string, pathPrefix: string): boolean {
  if (pathPrefix === '') return true
  return pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`)
}

function joinPathname(basePath: string, remainingPath: string): string {
  if (basePath === '' && remainingPath === '') return '/'
  if (basePath === '') return remainingPath || '/'
  if (remainingPath === '') return basePath
  return `${basePath}${remainingPath}`
}

function sliceRemainingPath(pathname: string, pathPrefix: string): string {
  if (pathPrefix === '') return pathname
  if (pathname === pathPrefix) return ''
  return pathname.slice(pathPrefix.length)
}

export function matchRoute<T extends RouteLike>(routes: readonly T[], reqUrl: string): T | null {
  const pathname = parseRequestUrl(reqUrl).pathname
  let bestMatch: T | null = null
  let bestLength = -1

  for (const route of routes) {
    if (!matchesPathPrefix(pathname, route.pathPrefix)) {
      continue
    }

    if (route.pathPrefix.length > bestLength) {
      bestMatch = route
      bestLength = route.pathPrefix.length
    }
  }

  return bestMatch
}

export function buildUpstreamPath(targetPathname: string, pathPrefix: string, reqUrl: string): string {
  const requestUrl = parseRequestUrl(reqUrl)
  const basePath = targetPathname === '/' ? '' : targetPathname
  const remainingPath = sliceRemainingPath(requestUrl.pathname, pathPrefix)
  const upstreamPathname = joinPathname(basePath, remainingPath)

  return `${upstreamPathname}${requestUrl.search}`
}

export function getDisplayUrl(targetBase: URL, upstreamPath: string): string {
  return `${targetBase.origin}${upstreamPath}`
}

export function buildUpstreamHeaders(
  requestHeaders: http.IncomingHttpHeaders,
  targetBase: URL,
): http.OutgoingHttpHeaders {
  const headers: http.OutgoingHttpHeaders = {}

  for (const [key, value] of Object.entries(requestHeaders)) {
    if (key === 'accept-encoding') {
      continue
    }

    headers[key] = key === 'host' ? targetBase.host : value
  }

  return headers
}
