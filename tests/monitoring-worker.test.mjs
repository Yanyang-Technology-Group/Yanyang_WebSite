import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { Miniflare, createFetchMock } from 'miniflare'

const bundle = await build({
  stdin: { contents: `import {handleCloudflareAnalytics} from './src/services/cloudflare-analytics';
    import {handleCloudflareStatus} from './src/services/cloudflare-status';
    export default {fetch(request, env) {return new URL(request.url).pathname.endsWith('/status')
      ? handleCloudflareStatus(request, env) : handleCloudflareAnalytics(request, env)}}`, resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', target: 'es2022',
})
const schema = (await readFile(new URL('../migrations/0002_monitoring.sql', import.meta.url), 'utf8')).replace(/^--.*$/gm, '')

async function worker() {
  const upstream = createFetchMock()
  upstream.disableNetConnect()
  const mf = new Miniflare({
    modules: true, compatibilityDate: '2024-12-18', script: bundle.outputFiles[0].text,
    bindings: { CF_ZONE_ID: 'a'.repeat(32), CF_ANALYTICS_TOKEN: 'TEST_SECRET_NEVER_EXPOSE' }, d1Databases: ['DB'], fetchMock: upstream,
  })
  const db = await mf.getD1Database('DB')
  for (const sql of schema.split(';').filter(sql => sql.trim())) await db.prepare(sql).run()
  return { mf, upstream }
}

test('analytics runs inside workerd using real D1 bindings and supported fetch options', async () => {
  const { mf, upstream } = await worker()
  let calls = 0
  upstream.get('https://api.cloudflare.com').intercept({ path: '/client/v4/graphql', method: 'POST' })
    .reply(200, () => {
      calls++
      return JSON.stringify({ data: { viewer: { zones: [{
        totals: [{ count: 100, sum: { edgeResponseBytes: 4096, visits: 40 } }],
        series: [], cache: [{ count: 60, dimensions: { cacheStatus: 'hit' } }], ranking: [],
      }] } } })
    }, { headers: { 'Content-Type': 'application/json' } }).persist()
  try {
    const response = await mf.dispatchFetch('http://localhost/api/cloudflare/analytics?range=24h')
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.totals.requests, 100)
    assert.equal(body.totals.cacheHitRate, 60)
    assert.equal(calls, 9)
    await mf.dispatchFetch('http://localhost/api/cloudflare/analytics?range=24h')
    assert.equal(calls, 9, 'the Worker must reuse its real D1 cache')
    assert.ok(!JSON.stringify(body).includes('TEST_SECRET_NEVER_EXPOSE'))
    assert.ok(!JSON.stringify(body).includes('a'.repeat(32)))
  } finally { await mf.dispose() }
})

test('the Worker rejects redirects without forwarding authorization to another host', async () => {
  const { mf, upstream } = await worker()
  upstream.get('https://api.cloudflare.com').intercept({ path: '/client/v4/graphql', method: 'POST' })
    .reply(302, '', { headers: { Location: 'https://unexpected.example/collect' } })
  let forwarded = false
  upstream.get('https://unexpected.example').intercept({ path: '/collect' })
    .reply(200, () => { forwarded = true; return '{}' })
  try {
    const response = await mf.dispatchFetch('http://localhost/api/cloudflare/analytics?range=24h')
    assert.equal(response.status, 503)
    assert.equal((await response.json()).code, 'analytics_unavailable')
    assert.equal(forwarded, false)
  } finally { await mf.dispose() }
})

test('Cloudflare status also fetches successfully inside workerd and persists its snapshot', async () => {
  const { mf, upstream } = await worker()
  const flat = []
  const encode = value => {
    const index = flat.length
    flat.push(null)
    flat[index] = Array.isArray(value) ? value.map(encode) : value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).map(([key, child]) => [`_${encode(key)}`, encode(child)])) : value
    return index
  }
  encode({ loaderData: { 'routes/services': {
    components: { components: [{ id: 'cdn', type: 'service', name: 'CDN' }], component_groups: [] },
    timeline: { startDate: '2026-08-24', incidents: [], byComponent: {} },
  } } })
  const html = `<script>window.__reactRouterContext.streamController.enqueue(${JSON.stringify(JSON.stringify(flat))});</script>`
  let calls = 0
  upstream.get('https://www.cloudflarestatus.com').intercept({ path: '/services', method: 'GET' })
    .reply(200, () => { calls++; return html }, { headers: { 'Content-Type': 'text/html' } })
  try {
    for (let i = 0; i < 2; i++) {
      const response = await mf.dispatchFetch('http://localhost/api/cloudflare/status')
      assert.equal(response.status, 200)
      assert.equal((await response.json()).data.components.components[0].name, 'CDN')
    }
    assert.equal(calls, 1)
  } finally { await mf.dispose() }
})
