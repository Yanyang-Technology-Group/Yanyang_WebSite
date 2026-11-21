import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'
import type { ServerMetrics, ServerServiceStatus, ServerStats, ServiceStatus } from '../types'
import type { MetricPoint } from '../components/monitoring/MetricCard'

const RETENTION_MS = 60 * 60_000
const MAX_SERVERS = 64
const MAX_POINTS = 120
const MAX_SERVICES = 100
const SEVERITY: Record<ServiceStatus, number> = { running: 0, unknown: 1, starting: 2, stopped: 3 }

export interface ServiceSample { bucket: number; status: ServiceStatus }
export interface ServerHistory { metrics: MetricPoint[]; services: Record<string, ServiceSample[]> }
export type MonitoringHistory = Record<string, ServerHistory>

export function serviceKey(service: ServerServiceStatus): string {
  return JSON.stringify([service.group, service.name, service.check, service.target])
}

function prune(history: MonitoringHistory, now: number): MonitoringHistory {
  const cutoff = now - RETENTION_MS
  return Object.fromEntries(Object.entries(history).slice(-MAX_SERVERS).flatMap(([id, server]) => {
    if (!server || !Array.isArray(server.metrics) || typeof server.services !== 'object' || !server.services) return []
    const metrics = server.metrics.filter(point => typeof point.timestamp === 'number' && point.timestamp >= cutoff && point.timestamp <= now + 60_000).slice(-MAX_POINTS)
    const services = Object.fromEntries(Object.entries(server.services).slice(0, MAX_SERVICES).flatMap(([key, points]) => {
      if (!Array.isArray(points)) return []
      const valid = points.filter(point => typeof point.bucket === 'number' && point.bucket >= cutoff && point.bucket <= now && Object.hasOwn(SEVERITY, point.status)).slice(-60)
      return valid.length ? [[key, valid]] : []
    }))
    return metrics.length || Object.keys(services).length ? [[id, { metrics, services }]] : []
  }))
}

export function appendHistory(current: MonitoringHistory, servers: ServerStats[], now: number): MonitoringHistory {
  const next = prune(current, now)
  for (const server of servers.slice(0, MAX_SERVERS)) {
    const timestamp = server.receivedAt
    if (!Number.isFinite(timestamp) || now - timestamp > 60_000 || timestamp > now + 60_000) continue
    const previous = next[server.serverId] || { metrics: [], services: {} }
    const metrics = server.metrics
    const number = (value?: number) => typeof value === 'number' && Number.isFinite(value) ? value : null
    // One metric sample per minute keeps browser storage small and survives page reloads.
    // The latest sample replaces that minute's value; gaps are rendered as nulls.
    const bucket = Math.floor(timestamp / 60_000) * 60_000
    const point: MetricPoint = { timestamp,
      cpu: number(metrics.cpu?.usagePercent), memory: number(metrics.memory?.percent),
      diskRead: number(metrics.disk?.readBytesPerSec), diskWrite: number(metrics.disk?.writeBytesPerSec),
      netRx: number(metrics.network?.rxBytesPerSec), netTx: number(metrics.network?.txBytesPerSec),
    }
    const metricPoints = [...previous.metrics.filter(item => Math.floor(item.timestamp / 60_000) * 60_000 !== bucket), point].sort((a, b) => a.timestamp - b.timestamp).slice(-MAX_POINTS)
    const services = { ...previous.services }
    for (const service of (metrics.services || []).slice(0, MAX_SERVICES)) {
      const key = serviceKey(service)
      const points = services[key] || []
      const existing = points.find(item => item.bucket === bucket)
      const incoming = Object.hasOwn(SEVERITY, service.status) ? service.status : 'unknown'
      const status = existing && SEVERITY[existing.status] > SEVERITY[incoming] ? existing.status : incoming
      services[key] = [...points.filter(item => item.bucket !== bucket), { bucket, status }].sort((a, b) => a.bucket - b.bucket).slice(-60)
    }
    next[server.serverId] = { metrics: metricPoints, services }
  }
  return next
}

export function chartHistory(points: MetricPoint[], now: number): MetricPoint[] {
  const start = Math.floor(now / 60_000) * 60_000 - 59 * 60_000
  const byMinute = new Map(points.map(point => [Math.floor(point.timestamp / 60_000) * 60_000, point]))
  return Array.from({ length: 60 }, (_, index) => {
    const timestamp = start + index * 60_000
    return byMinute.get(timestamp) || { timestamp, cpu: null, memory: null, diskRead: null, diskWrite: null, netRx: null, netTx: null }
  })
}

interface StatsResponse {
  success: boolean; configured: boolean; servers?: ServerStats[]; histories?: MonitoringHistory; historyAvailable?: boolean
  data?: (Omit<ServerMetrics, 'services'> & { services?: Array<{ name?: string; session?: string; status?: string; running?: boolean }> }) | null
}

export function useServerMonitoring() {
  const [servers, setServers] = useState<ServerStats[]>([])
  const [history, setHistory] = useState<MonitoringHistory>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [configured, setConfigured] = useState(true)
  const [historyAvailable, setHistoryAvailable] = useState(true)
  const [now, setNow] = useState(Date.now())
  const refreshRef = useRef<() => void>(() => {})

  useEffect(() => {
    let active = true
    let pending = false
    let controller: AbortController | undefined
    const poll = async () => {
      if (pending || !active) return
      pending = true
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller?.abort(), 15_000)
      try {
        const response = await fetch(`${API_BASE_URL}/api/server/stats`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('stats_unavailable')
        const data = await response.json() as StatsResponse
        if (!active) return
        if (!data.success) throw new Error('stats_unavailable')
        const legacy: ServerStats[] = data.data ? [{
          serverId: 'legacy', displayName: data.data.hostname || 'Server', receivedAt: Date.now(), metrics: {
            ...data.data, services: data.data.services?.map(service => ({
              name: service.name || service.session || 'Service', group: 'Services', check: 'tmux', target: service.session || '',
              status: service.status === 'running' || service.status === 'starting' || service.status === 'unknown' ? service.status : service.running ? 'running' : 'stopped',
            })),
          },
        }] : []
        const incoming = (data.servers || legacy).slice(0, MAX_SERVERS).sort((a, b) => a.serverId.localeCompare(b.serverId))
        setServers(incoming)
        setConfigured(data.configured !== false)
        setError(false)
        setHistory(current => appendHistory(data.histories || current, incoming, Date.now()))
        setHistoryAvailable(data.historyAvailable !== false)
      } catch {
        if (active) setError(true)
      } finally {
        window.clearTimeout(timeout)
        pending = false
        if (active) { setLoading(false); setNow(Date.now()) }
      }
    }
    refreshRef.current = () => { void poll() }
    void poll()
    const timer = window.setInterval(() => { setNow(Date.now()); if (!document.hidden) void poll() }, 1000)
    const onVisible = () => { if (!document.hidden) void poll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; controller?.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const refresh = useCallback(() => refreshRef.current(), [])
  return { servers, history, loading, error, configured, historyAvailable, now, refresh }
}
