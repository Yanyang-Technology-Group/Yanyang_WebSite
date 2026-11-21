import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startPolling } from '../src/utils/polling.ts'

const settle = async () => { for (let i = 0; i < 6; i++) await Promise.resolve() }

test('a 35-second response survives the 30-second timer and manual refresh', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] })
  let calls = 0
  let completed = false
  let signal
  const poller = startPolling(async current => {
    calls++
    signal = current
    await new Promise(resolve => setTimeout(resolve, 35_000))
    completed = !current.aborted
  })
  t.mock.timers.tick(30_000)
  poller.refresh()
  assert.equal(calls, 1)
  assert.equal(signal.aborted, false)
  t.mock.timers.tick(5_000)
  await settle()
  assert.equal(completed, true)
  t.mock.timers.tick(25_000)
  assert.equal(calls, 2)
  poller.stop()
  assert.equal(signal.aborted, true)
})

test('cold refreshes retry shortly, while quota backoff suppresses interval and manual retries', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] })
  let calls = 0
  const poller = startPolling(async () => { calls++; return calls === 1 ? 3_000 : calls === 2 ? 120_000 : undefined })
  await settle()
  t.mock.timers.tick(3_000)
  await settle()
  assert.equal(calls, 2)
  t.mock.timers.tick(90_000)
  poller.refresh()
  assert.equal(calls, 2)
  t.mock.timers.tick(30_000)
  await settle()
  assert.equal(calls, 3)
  poller.stop()
})

test('disposal aborts the old range and removes its automatic retries', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'] })
  let calls = 0
  let signal
  const poller = startPolling(async current => { calls++; signal = current; return 3_000 })
  await settle()
  poller.stop()
  assert.equal(signal.aborted, true)
  t.mock.timers.tick(120_000)
  assert.equal(calls, 1)
})
