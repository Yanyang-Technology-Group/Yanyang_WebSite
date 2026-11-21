import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowClockwise, ArrowSquareOut, GlobeHemisphereWest, Info, WarningCircle } from '@phosphor-icons/react'
import { API_BASE_URL } from '../../config'
import { useLanguageContext } from '../../i18n/LanguageContext'
import { AreaChart } from '../tremor/AreaChart'
import { Panel, StatusBadge, cardClass } from './MonitoringUI'
import { formatBytes } from './MetricCard'
import { startPolling } from '../../utils/polling'

export const CDN_RANGES = ['1h', '6h', '12h', '24h', '7d', '30d'] as const
type CdnRange = typeof CDN_RANGES[number]
interface CdnAnalytics {
  success: true; domain: string; range: CdnRange; start: string; end: string; updatedAt: string; stale: boolean; sampled: boolean
  totals: { requests: number; bytes: number; visits: number; cacheHitRate: number | null }
  series: Array<{ timestamp: string; requests: number; bytes: number; visits: number }>
  rankings: Record<string, Array<{ name: string; requests: number }> | null>
}
const ERROR_LABELS: Record<string, string> = {
  analytics_not_configured: 'server.cdnNotConfigured',
  analytics_auth_error: 'server.cdnAuthError',
  analytics_forbidden: 'server.cdnForbidden',
  analytics_zone_unavailable: 'server.cdnZoneUnavailable',
  analytics_query_error: 'server.cdnQueryError',
  analytics_range_unavailable: 'server.cdnRangeUnavailable',
  analytics_rate_limited: 'server.cdnRateLimited',
  analytics_busy: 'server.cdnBusy',
  analytics_refreshing: 'server.loadingAnalytics',
  analytics_budget_exhausted: 'server.cdnBudgetExhausted',
  analytics_storage_unavailable: 'server.cdnStorageUnavailable',
}

export const CdnPanel = memo(function CdnPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t, locale } = useLanguageContext()
  const [range, setRange] = useState<CdnRange>('24h')
  const [data, setData] = useState<CdnAnalytics | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const poller = useRef<ReturnType<typeof startPolling> | null>(null)
  const [metric, setMetric] = useState<'requests' | 'bytes' | 'visits'>('requests')
  const number = new Intl.NumberFormat(locale)
  const refresh = useCallback(() => poller.current?.refresh(), [])

  useEffect(() => {
    let active = true
    setError('')
    setData(current => current?.range === range ? current : null)
    const task = startPolling(async signal => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/cloudflare/analytics?range=${range}`, { signal, cache: 'no-store' })
        const result = await response.json() as CdnAnalytics | { success: false; code?: string; retryAfterSeconds?: number }
        if (!active) return
        if (!result.success) {
          setError(result.code || 'analytics_unavailable')
          // A cold D1 lease is retried shortly; quota backoff follows the server.
          return (result.retryAfterSeconds || (result.code === 'analytics_refreshing' ? 3 : 30)) * 1000
        }
        if (!response.ok) throw new Error('analytics_unavailable')
        if (result.range !== range) throw new Error('analytics_unavailable')
        setData(result)
        setError('')
      } catch { if (active) setError('analytics_unavailable') }
      finally { if (active) setLoading(false) }
    })
    poller.current = task
    return () => { active = false; task.stop(); poller.current = null }
  }, [range])

  const rankingKeys = ['countries', 'browsers', 'operatingSystems', 'devices', 'httpVersions', 'statusCodes', 'dataCenters']
  const formatMetric = (value: number) => metric === 'bytes' ? formatBytes(value) : number.format(value)
  return <Panel title="yanyn.cn CDN" subtitle={t('server.cdnSubtitle')} icon={<GlobeHemisphereWest size={24} />} open={open} onToggle={onToggle}
    badge={<StatusBadge status={data ? data.stale ? 'starting' : 'running' : 'unknown'} label={t(data ? data.stale ? 'server.cached' : 'server.connected' : 'server.analytics')} />}
    summary={t(`server.ranges.${range}`)}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-sm font-semibold text-fg">{t('server.trafficOverview')}</h3><p className="mt-1 text-xs text-muted">{t('server.cdnRangeHint')}</p></div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="cdn-range">{t('server.timeRange')}</label>
        <select id="cdn-range" value={range} onChange={event => setRange(event.target.value as CdnRange)} className="cursor-pointer rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg focus:outline-primary">
          {CDN_RANGES.map(value => <option key={value} value={value}>{t(`server.ranges.${value}`)}</option>)}
        </select>
        <button type="button" onClick={refresh} disabled={loading} aria-label={t('server.refreshCdn')} className="cursor-pointer rounded-lg border border-border p-2 text-muted hover:bg-surface disabled:opacity-50"><ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} /></button>
      </div>
    </div>
    {error && <div role="status" className="mb-5 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted"><WarningCircle size={16} className="shrink-0 text-amber-500" />{t(ERROR_LABELS[error] || 'server.cdnError')}</div>}
    {loading && !data && <div role="status" className="py-12 text-center text-sm text-muted">{t('server.loadingAnalytics')}</div>}
    {data && <div className="space-y-5" aria-busy={loading}>
      {data.stale && <p className="text-xs text-amber-600 dark:text-amber-400">{t('server.staleAnalytics')}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: t('server.requests'), value: number.format(data.totals.requests) },
        { label: t('server.transferred'), value: formatBytes(data.totals.bytes) },
        { label: t('server.visits'), value: number.format(data.totals.visits) },
        { label: t('server.cacheHitRate'), value: data.totals.cacheHitRate == null ? '--' : `${data.totals.cacheHitRate.toFixed(2)}%` },
      ].map(item => <div key={item.label} className={`${cardClass} p-4`}><p className="text-xs text-muted">{item.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-fg">{item.value}</p><p className="mt-2 text-[10px] text-muted">{t(`server.ranges.${range}`)}</p></div>)}</div>
      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-semibold text-fg">{t('server.trafficTrend')}</h4>
          <div role="group" aria-label={t('server.chartMetric')} className="flex rounded-lg bg-surface p-1">{(['requests', 'bytes', 'visits'] as const).map(key => <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)} className={`cursor-pointer rounded-md px-2.5 py-1 text-xs ${metric === key ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'}`}>{t(key === 'bytes' ? 'server.transferred' : `server.${key}`)}</button>)}</div>
        </div>
        <p className="mb-4 flex items-center gap-1.5 text-[11px] text-muted"><Info size={14} />{t('server.cdnChartHint')}</p>
        {data.series.length ? <AreaChart className="!h-64" data={data.series.map(point => ({ time: new Date(point.timestamp).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }), [t('server.selectedMetric')]: point[metric] }))} index="time" categories={[t('server.selectedMetric')]} colors={['blue']} valueFormatter={formatMetric} showLegend={false} showTooltip showGridLines startEndOnly fill="gradient" minValue={0} yAxisWidth={72} />
          : <div className="flex h-64 items-center justify-center text-xs text-muted">{t('server.noTraffic')}</div>}
      </div>
      <div className="grid items-start gap-3 md:grid-cols-2">{rankingKeys.map(key => {
        const rows = data.rankings[key]
        const highest = Math.max(1, ...(rows || []).map(row => row.requests))
        return <section key={key} className={`${cardClass} p-4 sm:p-5`}>
          <div className="mb-4 flex justify-between gap-2"><h4 className="text-sm font-semibold text-fg">{t(`server.rankings.${key}`)}</h4><span className="text-[10px] text-muted">{t('server.requests')}</span></div>
          {rows?.length ? <ol className="space-y-3">{rows.map((row, index) => <li key={`${row.name}-${index}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs"><span className="min-w-0 truncate text-fg" title={row.name}>{row.name || t('server.unknown')}</span><span className="shrink-0 tabular-nums text-muted">{number.format(row.requests)}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-blue-500/80" style={{ width: `${Math.min(100, row.requests / highest * 100)}%` }} /></div>
          </li>)}</ol> : <p className="py-6 text-center text-xs text-muted">{t(rows == null ? 'server.datasetUnavailable' : 'server.noTraffic')}</p>}
        </section>
      })}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] leading-relaxed text-muted"><span>{new Date(data.start).toLocaleString(locale)} — {new Date(data.end).toLocaleString(locale)}<br />{t('server.lastUpdate')} {new Date(data.updatedAt).toLocaleString(locale)} · {t('server.sampledHint')}</span>
        <a href="https://dash.cloudflare.com/7e07e876d2a2c5658da40d547a577510/yanyn.cn/analytics/requests" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{t('server.cloudflareDashboard')}<ArrowSquareOut size={13} /></a>
      </div>
    </div>}
  </Panel>
})
