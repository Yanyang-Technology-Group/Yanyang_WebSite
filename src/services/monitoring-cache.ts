import type { Env } from '../types'

interface CacheRow { data: string | null; updated_at: number; refresh_after: number }
export interface CacheResult<T> { data: T; stale: boolean }
// Leave a small margin so a 30-second UI timer doesn't miss a boundary due to jitter.
const REFRESH_MS = 29_000
const RETRY_MS = 60_000

export async function readMonitoringCache<T>(env: Env, key: string, load: () => Promise<T>): Promise<CacheResult<T>> {
  const now = Date.now()
  const row = await env.DB.prepare('SELECT data, updated_at, refresh_after FROM monitoring_cache WHERE cache_key = ?').bind(key).first<CacheRow>()
  const cached = row?.data ? JSON.parse(row.data) as T : undefined
  if (cached !== undefined && now - row!.updated_at < REFRESH_MS) return { data: cached, stale: false }
  const lease = await env.DB.prepare(`INSERT INTO monitoring_cache (cache_key, refresh_after) VALUES (?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET refresh_after = excluded.refresh_after
    WHERE monitoring_cache.refresh_after <= ?`).bind(key, now + RETRY_MS, now).run()
  if (!lease.meta.changes) {
    if (cached !== undefined) return { data: cached, stale: true }
    throw new Error('refresh_in_progress')
  }
  try {
    const data = await load()
    const finished = Date.now()
    await env.DB.prepare('UPDATE monitoring_cache SET data = ?, updated_at = ?, refresh_after = ? WHERE cache_key = ?')
      .bind(JSON.stringify(data), now, Math.max(now + REFRESH_MS, finished), key).run()
    return { data, stale: false }
  } catch {
    if (cached !== undefined) return { data: cached, stale: true }
    throw new Error('monitoring_unavailable')
  }
}

export async function takeAnalyticsBudget(env: Env): Promise<void> {
  // At most 24 refreshes / five minutes across all ranges and isolates.
  // Each refresh uses at most eight fixed, read-only upstream queries.
  const window = Math.floor(Date.now() / 300_000) * 300_000
  const result = await env.DB.prepare(`INSERT INTO monitoring_cache (cache_key, data, updated_at) VALUES ('cdn-api-budget', '1', ?)
    ON CONFLICT(cache_key) DO UPDATE SET
      data = CASE WHEN monitoring_cache.updated_at != excluded.updated_at THEN '1' ELSE CAST(CAST(monitoring_cache.data AS INTEGER) + 1 AS TEXT) END,
      updated_at = excluded.updated_at
    WHERE monitoring_cache.updated_at != excluded.updated_at OR CAST(monitoring_cache.data AS INTEGER) < 24`).bind(window).run()
  if (!result.meta.changes) throw new Error('analytics_busy')
}
