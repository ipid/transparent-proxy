import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import { validateConfig } from '../config.ts'

void describe('配置校验', () => {
  void it('允许根路由与更具体的路由共存，并会规范化结果', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transparent-proxy-config-'))

    try {
      const config = validateConfig({
        proxies: [
          {
            port: 21080,
            logDir: tempDir,
            routes: [
              { pathPrefix: '/', target: 'https://example.com/' },
              { pathPrefix: '/v1/', target: 'https://example.com/v1/' },
            ],
          },
        ],
      })

      assert.equal(config.proxies[0]?.routes[0]?.pathPrefix, '')
      assert.equal(config.proxies[0]?.routes[1]?.pathPrefix, '/v1')
      assert.equal(config.proxies[0]?.routes[1]?.target.toString(), 'https://example.com/v1')
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  void it('会拒绝规范化后重复的路由前缀', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'transparent-proxy-config-'))

    try {
      assert.throws(
        () =>
          validateConfig({
            proxies: [
              {
                port: 21080,
                logDir: tempDir,
                routes: [
                  { pathPrefix: '/v1', target: 'https://example.com/v1' },
                  { pathPrefix: '/v1/', target: 'https://example.com/another-v1' },
                ],
              },
            ],
          }),
        /重复的路由前缀/,
      )
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
