import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatTimestamp } from '../utils/time.ts'

void describe('时间工具函数', () => {
  void it('会生成稳定的时间戳字符串', () => {
    const now = new Date(2026, 3, 2, 11, 22, 33, 456)
    assert.equal(formatTimestamp(now, 0.789), '20260402112233456789')
  })
})
