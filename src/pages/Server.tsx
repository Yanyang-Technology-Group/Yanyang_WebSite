import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowClockwise, ArrowDown, ArrowUp, Cloud, Cpu, HardDrives, Info, Memory, Pulse, WarningCircle } from '@phosphor-icons/react'
import { useLanguageContext } from '../i18n/LanguageContext'
import type { ServerServiceStatus, ServerStats } from '../types'
import { chartHistory, serviceKey, useServerMonitoring, type ServerHistory, type ServiceSample } from '../hooks/useServerMonitoring'
import { MetricCard, formatBytes, type MetricPoint } from '../components/monitoring/MetricCard'
import { Panel, StatusBadge, StatusTimeline, cardClass, type TimelineEntry } from '../components/monitoring/MonitoringUI'
import { CloudflarePanel } from '../components/monitoring/CloudflarePanel'
import { CdnPanel } from '../components/monitoring/CdnPanel'

const STATUS_LABELS = { running: 'server.running', starting: 'server.starting', stopped: 'server.stopped', unknown: 'server.readFailed' } as const

function ServiceTile({ service, stale, samples, now }: { service: ServerServiceStatus; stale: boolean; samples: ServiceSample[]; now: number }) {
  const { t, locale } = useLanguageContext()
  const status = stale ? 'unknown' : service.status
  const style = STATUS_LABELS[status] || STATUS_LABELS.unknown
  const start = Math.floor(now / 60_000) * 60_000 - 59 * 60_000
  const byMinute = new Map(samples.map(sample => [sample.bucket, sample.status]))
  const entries: TimelineEntry[] = Array.from({ length: 60 }, (_, index) => {
    const timestamp = start + index * 60_000
    const recorded = byMinute.get(timestamp)
    return { label: new Date(timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false }), status: recorded || 'unknown', detail: recorded ? t(STATUS_LABELS[recorded]) : t('server.noSample') }
  })
  return <div className={`${cardClass} min-w-0 p-4`}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="text-sm font-semibold text-fg">{service.name}</h4><p className="mt-1 break-all text-[10px] text-muted">{service.check}: {service.target}</p></div><StatusBadge status={status} label={t(style)} /></div>
    {service.detail && <p className="mt-2 break-words text-xs text-muted">{service.detail}</p>}
    {(service.cpuUsagePercent != null || service.memoryPercent != null) && <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
      {service.cpuUsagePercent != null && <div><p className="text-[10px] text-muted">{t('server.cpu')}</p><p className="mt-1 font-medium tabular-nums text-fg">{stale ? '--' : `${service.cpuUsagePercent.toFixed(1)}%`}</p><p className="mt-0.5 text-[10px] text-muted">{service.cpuBusyCores?.toFixed(2) ?? '--'} {t('server.cores')}</p></div>}
      {service.memoryPercent != null && <div><p className="text-[10px] text-muted">{t('server.memory')}</p><p className="mt-1 font-medium tabular-nums text-fg">{stale ? '--' : `${service.memoryPercent.toFixed(1)}%`}</p><p className="mt-0.5 text-[10px] text-muted">{service.memoryMB?.toFixed(1) ?? '--'} {t('server.mb')}</p></div>}
    </div>}
    <StatusTimeline title={t('server.statusHistory')} rangeLabel={t('server.sixtyMinutes')} entries={entries} />
  </div>
}

function ServerPanel({ server, history, open, onToggle, now }: { server: ServerStats; history?: ServerHistory; open: boolean; onToggle: () => void; now: number }) {
  const { t } = useLanguageContext()
  const metrics = server.metrics
  const stale = now - server.receivedAt > Math.max(25_000, (server.intervalSeconds || 5) * 3000)
  const cpu = stale ? null : metrics.cpu?.usagePercent ?? null
  const memory = stale ? null : metrics.memory?.percent ?? null
  const services = metrics.services || []
  const groups = [...new Set(services.map(service => service.group))]
  const points: MetricPoint[] = chartHistory(history?.metrics || [], now)
  const uptime = metrics.uptime == null ? '--' : `${Math.floor(metrics.uptime / 86400)}${t('server.days')} ${Math.floor(metrics.uptime % 86400 / 3600)}${t('server.hours')} ${Math.floor(metrics.uptime % 3600 / 60)}${t('server.minutes')}`
  const percent = (value: number) => `${value.toFixed(1)}%`
  const rate = (value: number) => formatBytes(value, true)
  return <Panel title={server.displayName} subtitle={metrics.platform || t('server.systemUnavailable')} icon={<HardDrives size={23} />} open={open} onToggle={onToggle}
    badge={<StatusBadge status={stale ? 'unknown' : 'running'} label={t(stale ? 'server.stale' : 'server.online')} />}
    summary={<span className="tabular-nums">CPU {cpu == null ? '--' : `${cpu.toFixed(1)}%`}<span className="mx-3 text-border">/</span>{t('server.memory')} {memory == null ? '--' : `${memory.toFixed(1)}%`}</span>}>
    <dl className="mb-5 grid gap-3 rounded-lg bg-surface p-4 text-xs sm:grid-cols-2 xl:grid-cols-4">{[
      [t('server.hostname'), metrics.hostname || '--'], [t('server.uptime'), uptime],
      [t('server.load'), metrics.load?.map(value => value.toFixed(2)).join(' / ') || '--'],
      [t('server.lastUpdate'), new Date(server.receivedAt).toLocaleTimeString()],
    ].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 break-words font-medium tabular-nums text-fg">{value}</dd></div>)}</dl>
    <div className="grid items-start gap-3 md:grid-cols-2">
      <MetricCard title={t('server.cpu')} icon={<Cpu size={17} />} percent={cpu} value={`${metrics.cpu?.busyCores?.toFixed(2) ?? '--'} / ${metrics.cpu?.cores ?? '--'} ${t('server.cores')}`} detail={metrics.cpu?.model || t('server.systemUnavailable')} points={points} formatter={percent} series={[{ label: t('server.cpu'), key: 'cpu', color: 'blue', current: cpu == null ? '--' : percent(cpu) }]} />
      <MetricCard title={t('server.memory')} icon={<Memory size={17} />} percent={memory} value={formatBytes(metrics.memory?.used ?? (metrics.memory?.usedMB == null ? undefined : metrics.memory.usedMB * 1024 ** 2))} detail={`${t('server.total')} ${formatBytes(metrics.memory?.total)}`} points={points} formatter={percent} series={[{ label: t('server.memory'), key: 'memory', color: 'violet', current: memory == null ? '--' : percent(memory) }]} />
      <MetricCard title={t('server.network')} icon={<span className="flex"><ArrowDown size={14} /><ArrowUp size={14} /></span>} points={points} formatter={rate} series={[
        { label: t('server.download'), key: 'netRx', color: 'emerald', current: stale ? '--' : rate(metrics.network?.rxBytesPerSec ?? Number.NaN) },
        { label: t('server.upload'), key: 'netTx', color: 'cyan', current: stale ? '--' : rate(metrics.network?.txBytesPerSec ?? Number.NaN) },
      ]} />
      <MetricCard title={t('server.diskIo')} icon={<HardDrives size={17} />} points={points} formatter={rate} series={[
        { label: t('server.diskRead'), key: 'diskRead', color: 'amber', current: stale ? '--' : rate(metrics.disk?.readBytesPerSec ?? Number.NaN) },
        { label: t('server.diskWrite'), key: 'diskWrite', color: 'pink', current: stale ? '--' : rate(metrics.disk?.writeBytesPerSec ?? Number.NaN) },
      ]} />
    </div>
    <div className="mt-7"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold text-fg">{t('server.services')}</h3><span className="text-[10px] text-muted">{t('server.localHistoryLabel')}</span></div>
      {groups.length ? groups.map(group => <section key={group} className="mb-5 last:mb-0"><h4 className="mb-3 text-xs font-medium text-muted">{group}</h4><div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">{services.filter(service => service.group === group).map(service => <ServiceTile key={serviceKey(service)} service={service} stale={stale} samples={history?.services[serviceKey(service)] || []} now={now} />)}</div></section>) : <p className="rounded-lg border border-border p-4 text-xs text-muted">{t('server.noServices')}</p>}
    </div>
  </Panel>
}

export default function Server() {
  const { t } = useLanguageContext()
  const { servers, history, loading, error, configured, historyAvailable, now, refresh } = useServerMonitoring()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current && servers.length) { initialized.current = true; setExpanded(current => ({ ...current, [servers[0].serverId]: true })) }
  }, [servers])
  const toggle = useCallback((id: string) => setExpanded(current => ({ ...current, [id]: !current[id] })), [])
  const toggleCdn = useCallback(() => toggle('cloud:yanyn-cdn'), [toggle])
  const toggleCloudflare = useCallback(() => toggle('cloud:cloudflare'), [toggle])
  const online = servers.filter(server => now - server.receivedAt <= Math.max(25_000, (server.intervalSeconds || 5) * 3000)).length
  return <div className="bg-surface/45 pb-16">
    <section className="pt-24 pb-7 sm:pt-28 sm:pb-9"><div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[.18em] text-muted"><Pulse size={14} className="text-emerald-500" />{t('server.monitoring')}</div>
      <div className="flex items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight text-fg">{t('server.title')}</h1><p className="mt-2 text-sm text-muted">{t('server.desc')}</p></div>
        <button type="button" onClick={refresh} disabled={loading} aria-label={t('server.refresh')} title={t('server.refresh')} className={`${cardClass} cursor-pointer p-2.5 text-muted hover:text-fg disabled:opacity-50`}><ArrowClockwise size={19} className={loading ? 'animate-spin' : ''} /></button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">{[
        { label: t('server.totalServers'), value: `${servers.length}`, icon: <HardDrives size={18} /> },
        { label: t('server.onlineServers'), value: `${online} / ${servers.length}`, icon: <Pulse size={18} /> },
        { label: t('server.cloudServices'), value: 'yanyn.cn / Cloudflare', icon: <Cloud size={18} /> },
      ].map(item => <div key={item.label} className={`${cardClass} flex items-center justify-between gap-3 px-4 py-4`}><div><p className="text-[11px] text-muted">{item.label}</p><p className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-fg">{item.value}</p></div><span className="text-muted">{item.icon}</span></div>)}</div>
    </div></section>
    <section className="mx-auto max-w-6xl space-y-4 px-4 sm:px-6">
      <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted"><Info size={15} className="mt-0.5 shrink-0" /><span>{t('server.localHistoryHint')}{!historyAvailable && <span className="ml-1 text-amber-600 dark:text-amber-400">{t('server.historyUnavailable')}</span>}</span></div>
      {!configured && <p role="status" className="rounded-lg border border-border bg-bg p-4 text-xs text-muted">{t('server.notConfigured')}</p>}
      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/5 p-4 text-xs text-red-600 dark:text-red-400"><WarningCircle size={17} />{t('server.offline')}</div>}
      {loading && <p role="status" className="py-10 text-center text-sm text-muted">{t('server.loading')}</p>}
      {!loading && configured && !error && !servers.length && <p className="py-6 text-center text-sm text-muted">{t('server.noServers')}</p>}
      {servers.map(server => <ServerPanel key={server.serverId} server={server} history={history[server.serverId]} now={now} open={!!expanded[server.serverId]} onToggle={() => toggle(server.serverId)} />)}
      <CdnPanel open={!!expanded['cloud:yanyn-cdn']} onToggle={toggleCdn} />
      <CloudflarePanel open={!!expanded['cloud:cloudflare']} onToggle={toggleCloudflare} />
    </section>
  </div>
}
