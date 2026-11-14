import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowClockwise, ArrowDown, ArrowUp, Cpu, HardDrives, Memory, WarningCircle } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { API_BASE_URL } from '../config'
import { useLanguageContext } from '../i18n/LanguageContext'
import type { ServerMetrics, ServerServiceStatus, ServerStats } from '../types'

interface StatsResponse {
  success: boolean
  configured: boolean
  servers?: ServerStats[]
  data?: (Omit<ServerMetrics, 'services'> & { services?: Array<{ name?: string; session?: string; status?: string; running?: boolean }> }) | null
  message?: string
}

interface HistoryPoint {
  timestamp: string
  cpu: number
  memory: number
  diskRead: number
  diskWrite: number
  netRx: number
  netTx: number
}

const REFRESH_INTERVAL = 5000
const HISTORY_LIMIT = 60
const ONLINE_WINDOW_MS = 25000

function formatBytes(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return '--'
  if (bytes < 1024) return `${bytes.toFixed(0)} B/s`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB/s`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB/s`
}

function formatMb(bytes: number | undefined, t: (key: string) => string): string {
  return bytes == null ? '--' : `${(bytes / 1024 ** 2).toFixed(0)} ${t('server.mb')}`
}

function formatUptime(seconds: number | undefined, t: (key: string) => string): string {
  if (seconds == null) return '--'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}${t('server.days')} ${hours}${t('server.hours')} ${minutes}${t('server.minutes')}`
}

function chartPoints(values: number[], max: number): string {
  if (!values.length) return ''
  const divisor = Math.max(max, ...values, 1)
  return values.map((value, index) => {
    const x = values.length === 1 ? 100 : 15 + (index / (values.length - 1)) * 85
    const y = 36 - (Math.min(value, divisor) / divisor) * 32
    return `${x},${y}`
  }).join(' ')
}

function legacyServer(metrics: NonNullable<StatsResponse['data']>, t: (key: string) => string): ServerStats {
  return {
    serverId: 'legacy',
    displayName: t('server.legacyName'),
    receivedAt: Date.now(),
    metrics: {
      ...metrics,
      services: metrics.services?.map(service => ({
        name: service.name || service.session || t('server.service'),
        group: t('server.services'),
        check: 'tmux',
        target: service.session || '',
        status: service.status === 'running' || service.status === 'starting' || service.status === 'unknown'
          ? service.status
          : service.running ? 'running' : 'stopped',
      })),
    },
  }
}

function Sparkline({ values, secondary, color, secondaryColor, max, formatScale, ariaLabel }: { values: number[]; secondary?: number[]; color: string; secondaryColor?: string; max: number; formatScale: (value: number) => string; ariaLabel: string }) {
  const points = chartPoints(values, max)
  const secondaryPoints = secondary ? chartPoints(secondary, max) : ''
  const grid = [1, 0.75, 0.5, 0.25, 0]
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-14 w-full overflow-visible" role="img" aria-label={ariaLabel}>
      {grid.map(level => {
        const y = 36 - level * 32
        return (
          <g key={level}>
            <path d={`M15 ${y} H100`} stroke="#9ca3af" strokeOpacity=".45" strokeWidth=".7" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <text x="13" y={y + 1.2} textAnchor="end" fill="#9ca3af" fontSize="3.2">{formatScale(max * level)}</text>
          </g>
        )
      })}
      {points && <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
      {secondaryPoints && <polyline points={secondaryPoints} fill="none" stroke={secondaryColor || color} strokeWidth="2" strokeDasharray="4 2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />}
    </svg>
  )
}

function MetricTile({
  title,
  value,
  detail,
  icon,
  values,
  secondary,
  color,
  secondaryColor,
  trendLabel,
  max,
  percent,
  pairedValues,
  formatScale,
}: {
  title: string
  value?: string
  detail?: string
  icon: ReactNode
  values: number[]
  secondary?: number[]
  color: string
  secondaryColor?: string
  trendLabel: string
  max: number
  percent?: number
  pairedValues?: Array<{ label: string; value: string; color: string }>
  formatScale?: (value: number) => string
}) {
  return (
    <div className="min-w-0 border border-border bg-bg p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        {icon}<span>{title}</span>
      </div>
      {pairedValues ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {pairedValues.map(item => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-0.5 w-3 shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </div>
              <strong className="mt-1 block truncate text-sm font-bold tabular-nums text-fg">{item.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <strong className="truncate text-xl font-bold tabular-nums text-fg">{value ?? '--'}</strong>
          {percent != null && <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">{percent.toFixed(1)}%</span>}
        </div>
      )}
      {percent != null && <div className="mt-2 h-1.5 bg-border"><div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div>}
      <Sparkline values={values} secondary={secondary} color={color} secondaryColor={secondaryColor} max={max} formatScale={formatScale || (number => `${number.toFixed(0)}%`)} ariaLabel={trendLabel} />
      {!pairedValues && detail && <div className="truncate text-xs text-muted">{detail}</div>}
    </div>
  )
}

const STATUS_STYLE: Record<ServerServiceStatus['status'], { dot: string; label: string }> = {
  running: { dot: 'bg-emerald-500', label: 'server.running' },
  starting: { dot: 'bg-amber-500', label: 'server.starting' },
  stopped: { dot: 'bg-red-500', label: 'server.stopped' },
  unknown: { dot: 'bg-gray-400', label: 'server.readFailed' },
}

function ServiceTile({ service, stale, t }: { service: ServerServiceStatus; stale: boolean; t: (key: string) => string }) {
  const status = stale ? 'unknown' : service.status
  const style = STATUS_STYLE[status]
  return (
    <div className="flex min-h-20 items-start justify-between gap-3 border border-border bg-bg p-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-snug text-fg">{service.name}</div>
        <div className="mt-1 break-all text-[11px] text-muted">{service.check}: {service.target}</div>
        {(service.cpuUsagePercent != null || service.memoryPercent != null) && (
          <div className="mt-2 grid gap-1.5 text-[11px] text-muted">
            {service.cpuUsagePercent != null && (
              <div>
                <div className="flex justify-between gap-3">
                  <span>{t('server.cpu')} · {service.cpuBusyCores?.toFixed(2) ?? '--'} {t('server.cores')}</span>
                  <span className="tabular-nums">{service.cpuUsagePercent.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-1 bg-border"><div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, service.cpuUsagePercent))}%` }} /></div>
              </div>
            )}
            {service.memoryPercent != null && (
              <div>
                <div className="flex justify-between gap-3">
                  <span>{t('server.memory')} · {service.memoryMB?.toFixed(1) ?? '--'} {t('server.mb')}</span>
                  <span className="tabular-nums">{service.memoryPercent.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-1 bg-border"><div className="h-full bg-orange-500" style={{ width: `${Math.max(0, Math.min(100, service.memoryPercent))}%` }} /></div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pt-0.5 text-xs text-muted" title={service.detail || t(style.label)}>
        <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />{t(style.label)}
      </div>
    </div>
  )
}

function ServerPanel({
  server,
  history,
  t,
}: {
  server: ServerStats
  history: HistoryPoint[]
  t: (key: string) => string
}) {
  const metrics = server.metrics
  const services = metrics.services || []
  const groups = [...new Set(services.map(service => service.group))]
  const stale = Date.now() - server.receivedAt > Math.max(ONLINE_WINDOW_MS, (server.intervalSeconds || 5) * 3000)
  const cpu = metrics.cpu?.usagePercent
  const memory = metrics.memory?.percent
  const cpuValues = history.map(point => point.cpu)
  const memoryValues = history.map(point => point.memory)

  return (
    <article className="border border-border bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-fg">{server.displayName}</h2>
            <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-xs ${stale ? 'border-gray-300 text-gray-500' : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400'}`}>
              <span className={`h-2 w-2 rounded-full ${stale ? 'bg-gray-400' : 'bg-emerald-500'}`} />
              {stale ? t('server.stale') : t('server.online')}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{metrics.platform || t('server.systemUnavailable')}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-right">
          <span className="text-muted">{t('server.hostname')}</span><span className="font-mono text-fg">{metrics.hostname || '--'}</span>
          <span className="text-muted">{t('server.uptime')}</span><span className="text-fg">{formatUptime(metrics.uptime, t)}</span>
          <span className="text-muted">{t('server.platform')}</span><span className="max-w-64 truncate text-fg" title={metrics.platform}>{metrics.platform || '--'}</span>
          <span className="text-muted">{t('server.load')}</span><span className="font-mono text-fg">{metrics.load?.map(value => value.toFixed(2)).join(' / ') || '--'}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile title={t('server.cpu')} value={cpu == null ? '--' : `${cpu.toFixed(1)}%`} detail={`${metrics.cpu?.busyCores?.toFixed(2) ?? '--'} / ${metrics.cpu?.cores ?? '--'} ${t('server.cores')} · ${metrics.cpu?.model || ''}`} icon={<Cpu size={16} />} values={cpuValues} color="#3b82f6" max={100} percent={cpu} trendLabel={t('server.trend')} />
        <MetricTile title={t('server.memory')} value={memory == null ? '--' : `${memory.toFixed(1)}%`} detail={`${metrics.memory?.usedMB != null ? `${metrics.memory.usedMB.toFixed(0)} ${t('server.mb')}` : formatMb(metrics.memory?.used, t)} / ${formatMb(metrics.memory?.total, t)}`} icon={<Memory size={16} />} values={memoryValues} color="#f97316" max={100} percent={memory} trendLabel={t('server.trend')} />
        <MetricTile title={t('server.diskIo')} icon={<HardDrives size={16} />} values={history.map(point => point.diskRead)} secondary={history.map(point => point.diskWrite)} color="#8b5cf6" secondaryColor="#ec4899" max={Math.max(1, ...history.map(point => point.diskRead), ...history.map(point => point.diskWrite))} formatScale={formatBytes} pairedValues={[
          { label: t('server.diskRead'), value: formatBytes(metrics.disk?.readBytesPerSec), color: '#8b5cf6' },
          { label: t('server.diskWrite'), value: formatBytes(metrics.disk?.writeBytesPerSec), color: '#ec4899' },
        ]} trendLabel={t('server.trend')} />
        <MetricTile title={t('server.network')} icon={<span className="flex"><ArrowDown size={14} /><ArrowUp size={14} /></span>} values={history.map(point => point.netRx)} secondary={history.map(point => point.netTx)} color="#0d9488" secondaryColor="#f97316" max={Math.max(1, ...history.map(point => point.netRx), ...history.map(point => point.netTx))} formatScale={formatBytes} pairedValues={[
          { label: t('server.download'), value: formatBytes(metrics.network?.rxBytesPerSec), color: '#0d9488' },
          { label: t('server.upload'), value: formatBytes(metrics.network?.txBytesPerSec), color: '#f97316' },
        ]} trendLabel={t('server.trend')} />
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-fg">{t('server.services')}</h3>
          <span className="text-xs text-muted">{metrics.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : '--'}</span>
        </div>
        {groups.length ? groups.map(group => (
          <section key={group} className="mb-4 last:mb-0">
            <h4 className="mb-2 border-l-2 border-primary pl-2 text-sm font-semibold text-fg">{group}</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {services.filter(service => service.group === group).map((service, index) => <ServiceTile key={`${service.target}-${index}`} service={service} stale={stale} t={t} />)}
            </div>
          </section>
        )) : <p className="border border-border bg-bg p-3 text-sm text-muted">{t('server.noServices')}</p>}
      </div>
    </article>
  )
}

export default function Server() {
  const { t } = useLanguageContext()
  const [servers, setServers] = useState<ServerStats[]>([])
  const [histories, setHistories] = useState<Record<string, HistoryPoint[]>>({})
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const requestInFlightRef = useRef(false)
  const requestRef = useRef<AbortController | null>(null)

  const fetchStats = useCallback(async () => {
    if (requestInFlightRef.current) return
    requestInFlightRef.current = true
    const controller = new AbortController()
    requestRef.current = controller
    try {
      const response = await fetch(`${API_BASE_URL}/api/server/stats`, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json() as StatsResponse
      const incomingServers = data.servers || (data.data ? [legacyServer(data.data, t)] : undefined)
      if (data.success && incomingServers) {
        setServers(incomingServers)
        setConfigured(true)
        setError('')
        setHistories(current => {
          const next = { ...current }
          for (const server of incomingServers) {
            const stamp = server.metrics.timestamp || new Date(server.receivedAt).toISOString()
            const points = next[server.serverId] || []
            if (points[points.length - 1]?.timestamp === stamp) continue
            next[server.serverId] = [...points, {
              timestamp: stamp,
              cpu: server.metrics.cpu?.usagePercent || 0,
              memory: server.metrics.memory?.percent || 0,
              diskRead: server.metrics.disk?.readBytesPerSec || 0,
              diskWrite: server.metrics.disk?.writeBytesPerSec || 0,
              netRx: server.metrics.network?.rxBytesPerSec || 0,
              netTx: server.metrics.network?.txBytesPerSec || 0,
            }].slice(-HISTORY_LIMIT)
          }
          return next
        })
      } else if (data.configured === false) {
        setServers([])
        setConfigured(false)
        setError('')
      } else {
        setServers([])
        setConfigured(true)
        setError(data.message || t('server.offline'))
      }
    } catch (caught) {
      if (controller.signal.aborted) return
      setServers([])
      setConfigured(true)
      setError(caught instanceof Error && caught.message !== 'Failed to fetch' ? caught.message : t('server.offline'))
    } finally {
      requestInFlightRef.current = false
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void fetchStats()
    const timer = window.setInterval(() => void fetchStats(), REFRESH_INTERVAL)
    return () => {
      window.clearInterval(timer)
      requestRef.current?.abort()
    }
  }, [fetchStats])

  return (
    <>
      <section className="bg-bg pt-20 pb-8 sm:pt-28 sm:pb-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-extrabold text-fg">{t('server.title')}</h1>
              <p className="mt-2 text-sm text-muted">{t('server.desc')}</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.cloudflarestatus.com/services" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 text-sm text-fg hover:border-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />{t('server.cloudflare')}
              </a>
              <button onClick={() => void fetchStats()} disabled={loading} aria-label={t('server.refresh')} title={t('server.refresh')} className="border border-border bg-surface p-2 text-muted hover:text-fg disabled:opacity-50">
                <ArrowClockwise size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
          {!configured && <div className="flex items-center gap-2 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"><WarningCircle size={18} />{t('server.notConfigured')}</div>}
          {error && <div className="flex items-center gap-2 border border-red-300 bg-red-50 p-4 text-sm text-red-700"><WarningCircle size={18} />{error}</div>}
          {loading && <p className="py-10 text-center text-sm text-muted">{t('server.loading')}</p>}
          {!loading && servers.length === 0 && !error && configured && <p className="py-10 text-center text-sm text-muted">{t('server.noServers')}</p>}
          {!loading && servers.length > 0 && <ScrollReveal><div className="space-y-5">{servers.map(server => <ServerPanel key={server.serverId} server={server} history={histories[server.serverId] || []} t={t} />)}</div></ScrollReveal>}
        </div>
      </section>
    </>
  )
}
