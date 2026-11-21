import { useId, useRef, useState, type ReactNode } from 'react'
import { CaretDown, ClockCounterClockwise } from '@phosphor-icons/react'
import { useLanguageContext } from '../../i18n/LanguageContext'

export const cardClass = 'rounded-xl border border-border bg-bg shadow-sm'

export function Panel({ title, subtitle, icon, badge, children, open, onToggle, summary }: {
  title: string; subtitle: string; icon: ReactNode; badge?: ReactNode; children: ReactNode
  open: boolean; onToggle: () => void; summary?: ReactNode
}) {
  const id = useId()
  const { t } = useLanguageContext()
  return <article className={`${cardClass} @container min-w-0`}>
    <h2>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-4 text-left transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:gap-4 sm:p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base font-semibold text-fg sm:text-lg">{title}{badge}</span>
          <span className="mt-1 block truncate text-xs font-normal tracking-normal text-muted">{subtitle}</span>
        </span>
        {summary && <span className="hidden text-xs font-normal tracking-normal text-muted @min-[640px]:block">{summary}</span>}
        <CaretDown size={18} aria-hidden className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="sr-only">{t(open ? 'server.collapse' : 'server.expand')}</span>
      </button>
    </h2>
    {open && <div id={id} className="border-t border-border p-4 sm:p-6">{children}</div>}
  </article>
}

const STATUS_CLASSES: Record<string, string> = {
  running: 'bg-emerald-500', operational: 'bg-emerald-500', none: 'bg-emerald-500',
  starting: 'bg-amber-400', degraded_performance: 'bg-amber-400', minor: 'bg-amber-400',
  partial_outage: 'bg-orange-500', major: 'bg-orange-500',
  stopped: 'bg-red-500', major_outage: 'bg-red-500', critical: 'bg-red-500',
  under_maintenance: 'bg-blue-500', maintenance: 'bg-blue-500', unknown: 'bg-slate-300 dark:bg-slate-600',
}

export function statusClass(status: string): string { return STATUS_CLASSES[status] || STATUS_CLASSES.unknown }

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium tracking-normal text-muted">
    <span className={`size-1.5 rounded-full ${statusClass(status)}`} />{label}
  </span>
}

export interface TimelineEntry { label: string; status: string; detail: string }

export function StatusTimeline({ entries, title, rangeLabel }: { entries: TimelineEntry[]; title: string; rangeLabel: string }) {
  const { t } = useLanguageContext()
  const [active, setActive] = useState<number | null>(null)
  const [tabStop, setTabStop] = useState(entries.length - 1)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const tooltipId = useId()
  const selected = active == null ? undefined : entries[active]
  return <div className="mt-4">
    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1.5 font-medium"><ClockCounterClockwise size={13} />{title}</span>
      <span>{rangeLabel}</span>
    </div>
    <div className="relative" onMouseLeave={() => setActive(null)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setActive(null) }}>
      <div role="group" aria-label={title} className="flex h-7 gap-[2px]">
        {entries.map((entry, index) => <button type="button" key={entry.label} ref={node => { buttons.current[index] = node }}
          tabIndex={index === tabStop ? 0 : -1} aria-label={`${entry.label}: ${entry.detail}`}
          aria-describedby={active === index ? tooltipId : undefined}
          onMouseEnter={() => setActive(index)} onFocus={() => { setActive(index); setTabStop(index) }} onClick={() => setActive(index)}
          onKeyDown={event => {
            const next = event.key === 'ArrowLeft' ? Math.max(0, index - 1) : event.key === 'ArrowRight' ? Math.min(entries.length - 1, index + 1) : event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : null
            if (event.key === 'Escape') setActive(null)
            if (next != null) { event.preventDefault(); setTabStop(next); buttons.current[next]?.focus() }
          }}
          className={`min-w-0 flex-1 cursor-pointer rounded-[2px] opacity-85 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${statusClass(entry.status)}`} />)}
      </div>
      {selected && <div id={tooltipId} role="tooltip" className="absolute top-9 right-0 left-0 z-30 rounded-lg border border-border bg-bg p-3 text-xs shadow-lg">
        <div className="font-semibold text-fg">{selected.label}</div>
        <div className="mt-1 whitespace-pre-line leading-relaxed text-muted">{selected.detail}</div>
      </div>}
    </div>
    <div className="mt-1.5 flex justify-between gap-2 text-[10px] text-muted"><span>{entries[0]?.label}</span><span>{t('server.historyHint')}</span><span>{entries.at(-1)?.label}</span></div>
  </div>
}
