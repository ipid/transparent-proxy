export function normalizePathPrefix(raw: string): string {
  if (raw.includes('?') || raw.includes('#')) {
    throw new Error(`pathPrefix 不能包含查询参数或片段标识符: ${raw}`)
  }

  const trimmed = raw.replace(/^\/+/, '').replace(/\/+$/, '')
  return trimmed === '' ? '' : `/${trimmed}`
}

export function normalizeTarget(raw: string, label: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`${label}.target 不是合法的 URL: ${raw}`)
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${label}.target 必须使用 http 或 https 协议`)
  }
  if (url.search !== '' || url.hash !== '') {
    throw new Error(`${label}.target 不能包含查询参数或片段标识符`)
  }

  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url
}

export function assertNoDuplicatePathPrefixes(pathPrefixes: readonly string[], label: string): void {
  const seen = new Set<string>()

  for (const pathPrefix of pathPrefixes) {
    if (seen.has(pathPrefix)) {
      const displayPrefix = pathPrefix === '' ? '/' : pathPrefix
      throw new Error(`${label} 中存在重复的路由前缀: "${displayPrefix}"`)
    }

    seen.add(pathPrefix)
  }
}
