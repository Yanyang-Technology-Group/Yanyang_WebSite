import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { MonitoringError, readMonitoringCache, takeAnalyticsBudget, type AnalyticsFailureCode } from './monitoring-cache'

const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql'
const RANGES = { '1h': 1, '6h': 6, '12h': 12, '24h': 24, '7d': 168, '30d': 720 } as const
type AnalyticsRange = keyof typeof RANGES
const DIMENSIONS = {
  countries: 'clientCountryName',
  browsers: 'userAgentBrowser',
  operatingSystems: 'userAgentOS',
  devices: 'clientDeviceType',
  httpVersions: 'clientRequestHTTPProtocol',
  statusCodes: 'edgeResponseStatus',
  dataCenters: 'coloCode',
} as const

interface AnalyticsGroup {
  count?: number
  sum?: { edgeResponseBytes?: number; visits?: number }
  dimensions?: Record<string, string | number>
}
interface AnalyticsData {
  success: true
  domain: 'yanyn.cn'
  range: AnalyticsRange
  start: string
  end: string
  updatedAt: string
  sampled: true
  totals: { requests: number; bytes: number; visits: number; cacheHitRate: number | null }
  cacheAvailable: boolean
  series: Array<{ timestamp: string; requests: number; bytes: number; visits: number }>
  rankings: Record<string, Array<{ name: string; requests: number }> | null>
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function upstreamFailure(status: number, errors: Array<{ message?: string; code?: number | string }> = []): MonitoringError {
  // Upstream text is inspected locally, but only a fixed code ever leaves this function.
  const message = errors.map(error => typeof error.message === 'string' ? error.message : '').join(' ').toLowerCase()
  const codes = errors.map(error => Number(error.code))
  let code: AnalyticsFailureCode = 'analytics_unavailable'
  if (status === 429 || /rate.?limit|too many requests|quota exceeded/.test(message)) code = 'analytics_rate_limited'
  else if (status === 401 || codes.some(value => [6003, 6103, 9106, 9109, 10000].includes(value)) || /invalid.*(?:token|credential)|authentication|unauthenticated/.test(message)) code = 'analytics_auth_error'
  else if (/cannot query field|unknown (?:type|argument|field)|syntax error|validation error|error parsing|not defined by type/.test(message)) code = 'analytics_query_error'
  else if (/time (?:range|window).*(?:large|exceed|limit)|older than|retention|maximum.*(?:duration|interval)|duration.*(?:long|exceed)|not allowed to access.*(?:field|node)|plan.*(?:limit|support)/.test(message)) code = 'analytics_range_unavailable'
  else if (status === 403 || /not authorized|unauthorized|forbidden|permission|access denied|does not have access/.test(message)) code = 'analytics_forbidden'
  return new MonitoringError(code)
}

async function query(env: Env, selection: string, start: string, end: string): Promise<Record<string, AnalyticsGroup[]>> {
  // Selection, endpoint, zone and time window are entirely server controlled.
  // No caller-provided URL, query, authorization, account or zone is forwarded.
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    redirect: 'error',
    headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(12_000),
    body: JSON.stringify({
      query: `query YanynPublicAnalytics($zone: string, $start: Time, $end: Time) {
        viewer { zones(filter: {zoneTag: $zone}) { ${selection.replaceAll('$filter', '{ datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball" }')} } }
      }`,
      variables: { zone: env.CF_ZONE_ID, start, end },
    }),
  })
  if (!response.ok) throw upstreamFailure(response.status)
  const result = await response.json() as {
    errors?: Array<{ message?: string; code?: number | string }>
    data?: { viewer?: { zones?: Array<Record<string, AnalyticsGroup[]>> } }
  }
  const zone = result.data?.viewer?.zones?.[0]
  if (result.errors?.length) throw upstreamFailure(response.status, result.errors)
  if (!zone) throw new MonitoringError('analytics_zone_unavailable')
  return zone
}

async function fetchAnalytics(env: Env, range: AnalyticsRange): Promise<AnalyticsData> {
  const end = new Date(Math.floor(Date.now() / 30_000) * 30_000).toISOString()
  const start = new Date(Date.parse(end) - RANGES[range] * 60 * 60_000).toISOString()
  const seriesLimit = RANGES[range] + 1
  const core = await query(env, `
    totals: httpRequestsAdaptiveGroups(limit: 1, filter: $filter) { count sum { edgeResponseBytes visits } }
    series: httpRequestsAdaptiveGroups(limit: ${seriesLimit}, filter: $filter, orderBy: [datetimeHour_ASC]) {
      count sum { edgeResponseBytes visits } dimensions { datetimeHour }
    }`, start, end)
  // Cache dimensions can be restricted independently. Do not discard valid traffic totals.
  let cache: AnalyticsGroup[] | null = null
  try {
    const data = await query(env, `cache: httpRequestsAdaptiveGroups(limit: 30, filter: $filter, orderBy: [count_DESC]) {
      count dimensions { cacheStatus }
    }`, start, end)
    cache = data.cache || []
  } catch { /* Leave the hit rate unavailable instead of fabricating a zero. */ }
  const total = core.totals?.[0]
  const requests = safeNumber(total?.count)
  const cachedRequests = (cache || []).reduce((sum, group) =>
    ['hit', 'stale', 'updating', 'revalidated'].includes(String(group.dimensions?.cacheStatus).toLowerCase())
      ? sum + safeNumber(group.count) : sum, 0)
  const rankings: AnalyticsData['rankings'] = {}
  // Limit concurrent upstream requests and isolate datasets restricted by the zone's plan.
  const dimensions = Object.entries(DIMENSIONS)
  for (let offset = 0; offset < dimensions.length; offset += 3) {
    await Promise.all(dimensions.slice(offset, offset + 3).map(async ([key, dimension]) => {
      try {
        const data = await query(env, `ranking: httpRequestsAdaptiveGroups(limit: 10, filter: $filter, orderBy: [count_DESC]) {
          count dimensions { ${dimension} }
        }`, start, end)
        rankings[key] = (data.ranking || []).map(group => ({
          name: String(group.dimensions?.[dimension] ?? 'Unknown').slice(0, 100),
          requests: safeNumber(group.count),
        }))
      } catch {
        rankings[key] = null
      }
    }))
  }
  return {
    success: true, domain: 'yanyn.cn', range, start, end, updatedAt: new Date().toISOString(), sampled: true, cacheAvailable: cache !== null,
    totals: { requests, bytes: safeNumber(total?.sum?.edgeResponseBytes), visits: safeNumber(total?.sum?.visits),
      cacheHitRate: cache !== null && requests > 0 ? Math.min(100, cachedRequests / requests * 100) : null },
    series: (core.series || []).map(group => ({
      timestamp: String(group.dimensions?.datetimeHour || ''), requests: safeNumber(group.count),
      bytes: safeNumber(group.sum?.edgeResponseBytes), visits: safeNumber(group.sum?.visits),
    })), rankings,
  }
}

export async function handleCloudflareAnalytics(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405, request)
  const params = new URL(request.url).searchParams
  const range = params.get('range') || '24h'
  if (!Object.hasOwn(RANGES, range) || [...params.keys()].some(key => key !== 'range') || params.getAll('range').length > 1) {
    return errorResponse('Unsupported analytics range', 400, request)
  }
  if (!env.CF_ANALYTICS_TOKEN || !/^[a-f0-9]{32}$/i.test(env.CF_ZONE_ID || '')) {
    return jsonResponse({ success: false, configured: false, code: 'analytics_not_configured' }, 200, request)
  }
  try {
    const result = await readMonitoringCache(env, 'yanyn.cn:cdn:' + env.CF_ZONE_ID + ':' + range + ':v1', async () => {
      await takeAnalyticsBudget(env)
      return fetchAnalytics(env, range as AnalyticsRange)
    })
    return jsonResponse({ ...result.data, stale: result.stale }, 200, request)
  } catch (error) {
    // Never return or log upstream bodies, credentials, headers, or GraphQL errors.
    const code = error instanceof MonitoringError ? error.code
      : error instanceof Error && /D1_ERROR|D1_EXEC_ERROR|SQLITE_|no such table/i.test(error.message) ? 'analytics_storage_unavailable' : 'analytics_unavailable'
    return jsonResponse({ success: false, configured: true, code }, 503, request)
  }
}
