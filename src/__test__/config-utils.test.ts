import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { assertNoDuplicatePathPrefixes, normalizePathPrefix, normalizeTarget } from '../utils/config.ts'

void describe('配置工具函数', () => {
  void it('会规范化 pathPrefix 的首尾斜杠', () => {
    assert.equal(normalizePathPrefix('/v1/'), '/v1')
    assert.equal(normalizePathPrefix('/v1/chat'), '/v1/chat')
    assert.equal(normalizePathPrefix('/'), '')
  })

  void it('会拒绝不以 / 开头的 pathPrefix', () => {
    assert.throws(() => normalizePathPrefix('v1/chat'))
  })

  void it('会拒绝包含查询参数或片段的 pathPrefix', () => {
    assert.throws(() => normalizePathPrefix('/v1?debug=1'))
    assert.throws(() => normalizePathPrefix('/v1#frag'))
  })

  void it('会规范化 target 并拒绝不合法的 URL', () => {
    assert.equal(normalizeTarget('https://example.com/v1/', 'routes[0]').toString(), 'https://example.com/v1')
    assert.throws(() => normalizeTarget('ftp://example.com/v1', 'routes[0]'))
    assert.throws(() => normalizeTarget('https://example.com/v1?x=1', 'routes[0]'))
  })

  void it('会在规范化后拒绝重复的路由前缀', () => {
    assert.throws(() => {
      assertNoDuplicatePathPrefixes(['/v1', '/v1'], 'routes')
    })
  })
})
