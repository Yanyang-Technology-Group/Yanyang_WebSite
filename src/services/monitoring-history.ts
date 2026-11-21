import type { Env, ServerStats, ServiceStatus } from '../types'

interface MetricPoint { timestamp: number; [key: string]: number | null }
interface ServiceSample { bucket: number; status: ServiceStatus }
export interface ServerHistory { metrics: MetricPoint[]; services: Record<string, ServiceSample[]> }
const SEVERITY: Record<ServiceStatus, number> = { running: 0, unknown: 1, starting: 2, stopped: 3 }
const HOUR = 3_600_000

export function extendHistory(previous: ServerHistory | null, server: ServerStats): ServerHistory {
  const bucket = Math.floor(server.receivedAt / 60_000) * 60_000
  const cutoff = bucket - 59 * 60_000
  const oldMetrics = (previous?.metrics || []).filter(point => point.timestamp >= cutoff).slice(-60)
  const metrics = server.metrics
  const number = (value?: number) => typeof value === 'number' && Number.isFinite(value) ? value : null
  if (!oldMetrics.some(point => Math.floor(point.timestamp / 60_000) * 60_000 === bucket)) {
    oldMetrics.push({ timestamp: server.receivedAt,
      cpu: number(metrics.cpu?.usagePercent), memory: number(metrics.memory?.percent),
      diskRead: number(metrics.disk?.readBytesPerSec), diskWrite: number(metrics.disk?.writeBytesPerSec),
      netRx: number(metrics.network?.rxBytesPerSec), netTx: number(metrics.network?.txBytesPerSec),
    })
  }
  const services: ServerHistory['services'] = Object.fromEntries(Object.entries(previous?.services || {}).slice(-100).flatMap(([key, samples]) => {
    const points = samples.filter(point => point.bucket >= cutoff).slice(-60)
    return points.length ? [[key, points]] : []
  }))
  for (const service of (metrics.services || []).slice(0, 100)) {
    const key = JSON.stringify([service.group, service.name, service.check, service.target])
    const samples = services[key] || []
    const existing = samples.find(point => point.bucket === bucket)
    const incoming = Object.hasOwn(SEVERITY, service.status) ? service.status : 'unknown'
    const status = existing && SEVERITY[existing.status] > SEVERITY[incoming] ? existing.status : incoming
    services[key] = [...samples.filter(point => point.bucket !== bucket), { bucket, status }].slice(-60)
  }
  return { metrics: oldMetrics.slice(-60), services: Object.fromEntries(Object.entries(services).slice(-100)) }
}

export async function saveServerHistory(env: Env, server: ServerStats): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await env.DB.prepare('SELECT data, updated_at FROM server_monitor_history WHERE server_id = ?')
      .bind(server.serverId).first<{ data: string; updated_at: number }>()
    const data = JSON.stringify(extendHistory(row ? JSON.parse(row.data) as ServerHistory : null, server))
    if (data === row?.data) return
    const result = await env.DB.prepare(`INSERT INTO server_monitor_history (server_id, data, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(server_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
      WHERE server_monitor_history.data = ?`).bind(server.serverId, data, server.receivedAt, row?.data ?? '').run()
    if (result.meta.changes) {
      await env.DB.prepare('DELETE FROM server_monitor_history WHERE updated_at < ?').bind(Date.now() - HOUR).run()
      return
    }
  }
}

export async function readServerHistories(env: Env): Promise<Record<string, ServerHistory>> {
  const result = await env.DB.prepare('SELECT server_id, data FROM server_monitor_history WHERE updated_at >= ? ORDER BY server_id LIMIT 64')
    .bind(Date.now() - HOUR).all<{ server_id: string; data: string }>()
  return Object.fromEntries((result.results || []).map(row => [row.server_id, JSON.parse(row.data) as ServerHistory]))
}
