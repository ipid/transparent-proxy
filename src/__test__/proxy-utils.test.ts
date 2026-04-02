import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildUpstreamHeaders, buildUpstreamPath, matchRoute } from '../utils/proxy.ts'

void describe('代理工具函数', () => {
  void it('会按最长前缀匹配路由，并忽略查询参数', () => {
    const routes = [
      { pathPrefix: '' },
      { pathPrefix: '/v1' },
      { pathPrefix: '/v1/chat' },
    ]

    assert.equal(matchRoute(routes, '/v1/chat?stream=true')?.pathPrefix, '/v1/chat')
    assert.equal(matchRoute(routes, '/v1/models')?.pathPrefix, '/v1')
    assert.equal(matchRoute([{ pathPrefix: '/v2' }], '/v1/models'), null)
  })

  void it('会保持原始请求路径与查询参数，不再额外补斜杠', () => {
    assert.equal(buildUpstreamPath('/v1', '/v1', '/v1'), '/v1')
    assert.equal(buildUpstreamPath('/v1', '/v1', '/v1?x=1'), '/v1?x=1')
    assert.equal(buildUpstreamPath('/api', '', '/chat/completions?stream=true'), '/api/chat/completions?stream=true')
  })

  void it('会重写 Host 并移除 Accept-Encoding', () => {
    const headers = buildUpstreamHeaders(
      {
        host: '127.0.0.1:21080',
        'accept-encoding': 'gzip',
        authorization: 'Bearer demo',
      },
      new URL('https://example.com/v1'),
    )

    assert.deepEqual(headers, {
      host: 'example.com',
      authorization: 'Bearer demo',
    })
  })
})
