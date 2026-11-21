import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const bundle = await build({
  stdin: { contents: `export * from './src/services/monitoring-history'; export * from './src/services/monitoring-cache'; export * from './src/services/cloudflare-status'; export * from './src/services/cloudflare-analytics'`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'es2022',
})
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const schema = await readFile(new URL('../migrations/0002_monitoring.sql', import.meta.url), 'utf8')

function environment() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(schema)
  const DB = { prepare(sql) {
    let args = []
    return {
      bind(...values) { args = values; return this },
      async first() { return sqlite.prepare(sql).get(...args) || null },
      async all() { return { results: sqlite.prepare(sql).all(...args) } },
      async run() { const result = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(result.changes) } } },
    }
  } }
  return { DB, sqlite, CF_ZONE_ID: 'a'.repeat(32), CF_ANALYTICS_TOKEN: 'TEST_SECRET_NEVER_EXPOSE' }
}
const request = (path = '/api/cloudflare/analytics', options) => new Request(`https://backend.example${path}`, options)
const report = (timestamp, status = 'running') => ({
  serverId: 'server-a', displayName: 'A', receivedAt: timestamp,
  metrics: { cpu: { usagePercent: 12.5 }, memory: { percent: 25 }, services: [{ name: 'Minecraft', group: 'Game', check: 'tcp', target: '127.0.0.1:25565', status }] },
})
function upstreamMock(env, { fail = false, restrictedDimension = '' } = {}) {
  const calls = []
  const mock = async (url, options) => {
    calls.push({ url, options })
    assert.equal(url, 'https://api.cloudflare.com/client/v4/graphql')
    assert.equal(options.headers.Authorization, `Bearer ${env.CF_ANALYTICS_TOKEN}`)
    assert.equal(options.redirect, 'error')
    const body = JSON.parse(options.body)
    assert.equal(body.variables.zone, env.CF_ZONE_ID)
    assert.equal(body.variables.filter.requestSource, 'eyeball')
    if (fail) return Response.json({ errors: [{ message: env.CF_ANALYTICS_TOKEN }] }, { status: 403 })
    if (restrictedDimension && body.query.includes(restrictedDimension)) return Response.json({ errors: [{ message: 'restricted' }] })
    const dimension = body.query.match(/count dimensions \{ (\w+) \}/)?.[1]
    const zone = body.query.includes('totals:') ? {
      totals: [{ count: 100, sum: { edgeResponseBytes: 4096, visits: 40 } }],
      series: [{ count: 100, sum: { edgeResponseBytes: 4096, visits: 40 }, dimensions: { datetimeHour: body.variables.filter.datetime_geq } }],
      cache: [{ count: 60, dimensions: { cacheStatus: 'hit' } }, { count: 40, dimensions: { cacheStatus: 'miss' } }],
    } : { ranking: [{ count: 70, dimensions: { [dimension]: 'Example' } }] }
    return Response.json({ data: { viewer: { zones: [zone] } } })
  }
  return { calls, mock }
}

await test('history retains 60 minute samples, preserves incidents within a minute, and leaves absent metrics null', () => {
  const start = Math.floor(Date.now() / 60000) * 60000 - 65 * 60000
  let history = null
  for (let i = 0; i < 66; i++) history = api.extendHistory(history, report(start + i * 60000))
  assert.equal(history.metrics.length, 60)
  assert.equal(history.metrics[0].timestamp, start + 6 * 60000)
  assert.equal(history.metrics[0].diskRead, null)
  history = api.extendHistory(history, report(start + 65 * 60000 + 1, 'stopped'))
  history = api.extendHistory(history, report(start + 65 * 60000 + 2, 'running'))
  assert.equal(Object.values(history.services)[0].at(-1).status, 'stopped')
  assert.equal(Object.values(history.services)[0].length, 60)
})

await test('D1 history overwrites one row and survives concurrent updates without losing an outage', async () => {
  const env = environment()
  const timestamp = Date.now()
  await api.saveServerHistory(env, report(timestamp))
  await Promise.all([api.saveServerHistory(env, report(timestamp + 1, 'stopped')), api.saveServerHistory(env, report(timestamp + 1, 'running'))])
  const histories = await api.readServerHistories(env)
  assert.equal(Object.values(histories['server-a'].services)[0].at(-1).status, 'stopped')
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM server_monitor_history').get().n, 1)
})

await test('D1 history expires records older than an hour', async () => {
  const env = environment()
  env.sqlite.prepare('INSERT INTO server_monitor_history VALUES (?, ?, ?)').run('old', '{"metrics":[],"services":{}}', Date.now() - 3600001)
  await api.saveServerHistory(env, report(Date.now()))
  assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM server_monitor_history').get().n, 1)
})

await test('D1 cache leases prevent duplicate loads across concurrent callers and refresh on the 30-second boundary', async () => {
  const env = environment()
  let loads = 0
  const loader = async () => { loads++; return { value: loads } }
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => api.readMonitoringCache(env, 'test', loader)))
  assert.equal(loads, 1)
  assert.ok(results.some(result => result.status === 'fulfilled'))
  assert.equal((await api.readMonitoringCache(env, 'test', loader)).data.value, 1)
  env.sqlite.prepare('UPDATE monitoring_cache SET updated_at = ?, refresh_after = 0 WHERE cache_key = ?').run(Date.now() - 30001, 'test')
  assert.equal((await api.readMonitoringCache(env, 'test', loader)).data.value, 2)
})

await test('public analytics rejects methods, arbitrary query parameters, duplicate ranges and invalid ranges before calling upstream', async () => {
  const env = environment()
  const original = globalThis.fetch
  globalThis.fetch = () => { throw new Error('must not fetch') }
  try {
    assert.equal((await api.handleCloudflareAnalytics(request(undefined, { method: 'POST' }), env)).status, 405)
    for (const query of ['range=forever', 'range=24h&zone=other', 'range=24h&range=1h', 'query=anything', 'url=https://evil.example']) {
      assert.equal((await api.handleCloudflareAnalytics(request(`/api/cloudflare/analytics?${query}`), env)).status, 400)
    }
    assert.equal((await (await api.handleCloudflareAnalytics(request(), { ...env, CF_ANALYTICS_TOKEN: undefined })).json()).configured, false)
  } finally { globalThis.fetch = original }
})

await test('analytics returns only aggregate data, calculates cache hit rate and reuses the D1 cache', async () => {
  const env = environment()
  const upstream = upstreamMock(env)
  const original = globalThis.fetch
  globalThis.fetch = upstream.mock
  try {
    const response = await api.handleCloudflareAnalytics(request(), env)
    const raw = await response.text()
    assert.equal(response.status, 200)
    assert.ok(!raw.includes(env.CF_ANALYTICS_TOKEN))
    assert.ok(!raw.includes(env.CF_ZONE_ID))
    const result = JSON.parse(raw)
    assert.deepEqual(result.totals, { requests: 100, bytes: 4096, visits: 40, cacheHitRate: 60 })
    assert.equal(Object.keys(result.rankings).length, 7)
    assert.equal(upstream.calls.length, 8)
    await api.handleCloudflareAnalytics(request(), env)
    assert.equal(upstream.calls.length, 8)
    assert.ok(!env.sqlite.prepare('SELECT data FROM monitoring_cache WHERE cache_key LIKE ?').get('yanyn.cn:%').data.includes(env.CF_ANALYTICS_TOKEN))
  } finally { globalThis.fetch = original }
})

await test('each allowed time range has isolated cache and fixed upstream dates', async () => {
  const env = environment()
  const upstream = upstreamMock(env)
  const original = globalThis.fetch
  globalThis.fetch = upstream.mock
  try {
    for (const [range, hours] of Object.entries({ '1h': 1, '6h': 6, '12h': 12, '24h': 24, '7d': 168, '30d': 720 })) {
      const data = await (await api.handleCloudflareAnalytics(request(`/api/cloudflare/analytics?range=${range}`), env)).json()
      assert.equal(data.range, range)
      assert.equal(Date.parse(data.end) - Date.parse(data.start), hours * 3600000)
    }
    assert.equal(env.sqlite.prepare('SELECT COUNT(*) AS n FROM monitoring_cache WHERE cache_key LIKE ?').get('yanyn.cn:%').n, 6)
  } finally { globalThis.fetch = original }
})

await test('restricted ranking datasets do not discard supported analytics', async () => {
  const env = environment()
  const upstream = upstreamMock(env, { restrictedDimension: 'userAgentOS' })
  const original = globalThis.fetch
  globalThis.fetch = upstream.mock
  try {
    const data = await (await api.handleCloudflareAnalytics(request(), env)).json()
    assert.equal(data.success, true)
    assert.equal(data.rankings.operatingSystems, null)
    assert.equal(data.rankings.countries.length, 1)
  } finally { globalThis.fetch = original }
})

await test('upstream errors never expose credentials, and stale D1 data is retained on errors', async () => {
  const env = environment()
  const original = globalThis.fetch
  try {
    globalThis.fetch = upstreamMock(env, { fail: true }).mock
    const failure = await api.handleCloudflareAnalytics(request(), env)
    assert.equal(failure.status, 503)
    assert.ok(!(await failure.text()).includes(env.CF_ANALYTICS_TOKEN))
    env.sqlite.exec('DELETE FROM monitoring_cache')
    globalThis.fetch = upstreamMock(env).mock
    await api.handleCloudflareAnalytics(request(), env)
    env.sqlite.prepare('UPDATE monitoring_cache SET updated_at = ?, refresh_after = 0').run(Date.now() - 30001)
    globalThis.fetch = upstreamMock(env, { fail: true }).mock
    const stale = await (await api.handleCloudflareAnalytics(request(), env)).json()
    assert.equal(stale.success, true)
    assert.equal(stale.stale, true)
    assert.equal(stale.totals.requests, 100)
  } finally { globalThis.fetch = original }
})

await test('analytics budget is shared across callers and bounded to 24 refreshes per five minutes', async () => {
  const env = environment()
  const results = await Promise.allSettled(Array.from({ length: 50 }, () => api.takeAnalyticsBudget(env)))
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 24)
})

await test('Cloudflare structured HTML is decoded without executing scripts', () => {
  const flat = []
  function encode(value) {
    const index = flat.length
    flat.push(null)
    flat[index] = Array.isArray(value) ? value.map(encode) : value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).map(([key, child]) => [`_${encode(key)}`, encode(child)])) : value
    return index
  }
  const fixture = { loaderData: { 'routes/services': {
    components: { components: [{ id: 'svc', type: 'service', name: 'CDN' }, { id: 'loc', type: 'location' }], component_groups: [{ id: 'group', type: 'service' }] },
    timeline: { startDate: '2026-08-24', incidents: [['incident', 'Incident title', 'minor']], byComponent: { svc: [[0, 'minor', [0]]] } },
  } } }
  encode(fixture)
  const html = `<script>window.__reactRouterContext.streamController.enqueue(${JSON.stringify(JSON.stringify(flat))});</script>`
  const result = api.parseStatusPage(html)
  assert.equal(result.components.components.length, 1)
  assert.equal(result.timeline.byComponent.svc[0][1], 'minor')
  assert.throws(() => api.parseStatusPage('<script>throw new Error("not executed")</script>'))
})
