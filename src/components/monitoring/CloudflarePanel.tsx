import { memo, useEffect, useMemo, useState } from 'react'
import { ArrowSquareOut, Cloud, MagnifyingGlass } from '@phosphor-icons/react'
import snapshot from '../../data/cloudflare-status.snapshot.json'
import { API_BASE_URL } from '../../config'
import { useLanguageContext } from '../../i18n/LanguageContext'
import { Panel, StatusBadge, StatusTimeline, type TimelineEntry } from './MonitoringUI'

interface SnapshotComponent { id: string; name: string; status: string; type: string; group_id: string; position: number }
interface SnapshotTimeline { startDate: string; incidents: string[][]; byComponent: Record<string, Array<[number, string, number[]]>> }
interface StatusSnapshot { source: string; capturedAt: string; timeline: SnapshotTimeline; components: { components: SnapshotComponent[]; component_groups: Array<{ id: string; type: string; name: string; position: number }> } }

export const CloudflarePanel = memo(function CloudflarePanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t, locale } = useLanguageContext()
  const serviceName = (name: string) => {
    const key = `server.cfNames.${name}`
    const translated = t(key)
    return translated === key ? name : translated
  }
  const [search, setSearch] = useState('')
  const [onlyAffected, setOnlyAffected] = useState(false)
  const [data, setData] = useState<StatusSnapshot>(snapshot as unknown as StatusSnapshot)
  const [live, setLive] = useState(false)
  const [stale, setStale] = useState(false)
  useEffect(() => {
    let active = true
    let pending = false
    let controller: AbortController | undefined
    const poll = async () => {
      if (pending) return
      pending = true
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller?.abort(), 20_000)
      try {
        const response = await fetch(`${API_BASE_URL}/api/cloudflare/status`, { signal: controller.signal, cache: 'no-store' })
        const result = await response.json() as { success: boolean; data: StatusSnapshot; stale: boolean }
        if (!response.ok || !result.success) throw new Error('status_unavailable')
        if (active) { setData(result.data); setLive(true); setStale(result.stale) }
      } catch { if (active) setStale(true) }
      finally { window.clearTimeout(timeout); pending = false }
    }
    void poll()
    const timer = window.setInterval(() => { if (!document.hidden) void poll() }, 30_000)
    return () => { active = false; controller?.abort(); window.clearInterval(timer) }
  }, [])
  const timeline = data.timeline
  const services = data.components.components.filter(component => component.type === 'service')
  const groups = data.components.component_groups.filter(group => group.type === 'service').sort((a, b) => a.position - b.position)
  const dates = useMemo(() => Array.from({ length: 90 }, (_, index) => new Date(Date.parse(`${timeline.startDate}T00:00:00Z`) + index * 86_400_000).toLocaleDateString(locale, { timeZone: 'UTC', month: 'short', day: 'numeric' })), [locale, timeline.startDate])
  const affected = services.filter(service => service.status !== 'operational').length
  const matches = services.filter(service => `${service.name} ${serviceName(service.name)}`.toLowerCase().includes(search.trim().toLowerCase()) && (!onlyAffected || service.status !== 'operational'))
  return <Panel title="Cloudflare" subtitle={t('server.cloudflareSubtitle')} icon={<Cloud size={24} />} open={open} onToggle={onToggle}
    badge={<StatusBadge status={live && !stale ? 'running' : 'maintenance'} label={t(live && !stale ? 'server.connected' : 'server.snapshot')} />} summary={`${services.length} ${t('server.serviceCount')} · ${groups.length} ${t('server.groupCount')}`}>
    {open && <><div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-medium text-fg">{t('server.cloudflareSummary', { count: services.length, affected })}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t('server.snapshotAt')} {new Date(data.capturedAt).toLocaleString(locale)} · {t(live && !stale ? 'server.autoRefresh30' : 'server.snapshotHint')}</p></div>
      <a href={data.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">{t('server.source')}<ArrowSquareOut size={14} /></a>
    </div>
    <div className="mb-5 flex flex-wrap gap-3">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2 text-muted"><MagnifyingGlass size={16} />
        <input className="w-full min-w-0 bg-transparent text-sm text-fg outline-none" aria-label={t('server.searchServices')} placeholder={t('server.searchServices')} value={search} onChange={event => setSearch(event.target.value)} />
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted"><input type="checkbox" checked={onlyAffected} onChange={event => setOnlyAffected(event.target.checked)} className="accent-blue-500" />{t('server.onlyAffected')}</label>
    </div>
    <div className="space-y-5">{groups.map(group => {
      const members = matches.filter(component => component.group_id === group.id).sort((a, b) => a.position - b.position)
      if (!members.length) return null
      return <section key={group.id}>
        <h3 title={group.name} className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">{serviceName(group.name)}<span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-normal text-muted">{members.length}</span></h3>
        <div className="grid items-start gap-3 md:grid-cols-2">{members.map(service => {
          const events = new Map((timeline.byComponent[service.id] || []).map(([day, impact, incidents]) => [day, { impact, incidents }]))
          const entries: TimelineEntry[] = dates.map((date, day) => {
            const event = events.get(day)
            return { label: date, status: event?.impact || 'none', detail: event ? event.incidents.map(index => timeline.incidents[index]?.[1]).filter(Boolean).join('\n') : t('server.noIncidents') }
          })
          return <div key={service.id} className="min-w-0 rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-2"><h4 title={service.name} className="text-sm font-medium text-fg">{serviceName(service.name)}</h4><StatusBadge status={service.status} label={t(`server.cfStatus.${service.status}`)} /></div>
            <StatusTimeline title={t('server.statusHistory')} rangeLabel={t('server.ninetyDays')} entries={entries} />
          </div>
        })}</div>
      </section>
    })}</div>
    {matches.length === 0 && <p className="py-8 text-center text-sm text-muted">{t('server.noMatches')}</p>}
    <div className="mt-6 flex flex-wrap gap-4 text-[11px] text-muted">{['none', 'minor', 'major', 'critical', 'maintenance'].map(status => <StatusBadge key={status} status={status} label={t(`server.impact.${status}`)} />)}</div></>}
  </Panel>
})
