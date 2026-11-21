import { useId, useMemo, useState, type ReactNode } from 'react'
import { CaretDown, Info } from '@phosphor-icons/react'
import { AreaChart } from '../tremor/AreaChart'
import { DonutChart } from '../tremor/DonutChart'
import type { AvailableChartColorsKeys } from '../tremor/utils/chartColors'
import { useLanguageContext } from '../../i18n/LanguageContext'
import { cardClass } from './MonitoringUI'

export interface MetricSeries { label: string; key: string; color: AvailableChartColorsKeys; current: string }
export interface MetricPoint { timestamp: number; [key: string]: number | null }

export function formatBytes(value: number | null | undefined, rate = false): string {
  if (value == null || !Number.isFinite(value)) return '--'
  const unit = rate ? '/s' : ''
  if (value < 1024) return `${value.toFixed(0)} B${unit}`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB${unit}`
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MiB${unit}`
  return `${(value / 1024 ** 3).toFixed(2)} GiB${unit}`
}

export function MetricCard({ title, icon, value, detail, percent, series, points, formatter, hint }: {
  title: string; icon: ReactNode; value?: string; detail?: string; percent?: number | null
  series: MetricSeries[]; points: MetricPoint[]; formatter: (value: number) => string; hint?: string
}) {
  const { t, locale } = useLanguageContext()
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  const finitePercent = percent != null && Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null
  const data = useMemo(() => points.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(locale, { hour12: false }),
    ...Object.fromEntries(series.map(item => [item.label, point[item.key]])),
  })), [points, locale, series])
  const hasData = points.some(point => series.some(item => point[item.key] != null))
  return <section className={`${cardClass} min-w-0 p-4`}>
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium text-muted">{icon}{title}</h3>
      <button type="button" aria-expanded={expanded} aria-controls={id} aria-label={`${title} · ${t(expanded ? 'server.hideChart' : 'server.showChart')}`}
        onClick={() => setExpanded(current => !current)} className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary">
        <CaretDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
    <div className={`mt-4 flex min-h-28 items-center gap-4 ${percent !== undefined ? '' : 'justify-between'}`}>
      {percent !== undefined && <div className="relative size-28 shrink-0" role="img" aria-label={`${title}: ${finitePercent == null ? t('server.noData') : `${finitePercent.toFixed(1)}%`}`}>
        <DonutChart className="!h-28 !w-28" category="name" value="value" colors={[finitePercent == null ? 'gray' : series[0].color, 'gray']}
          data={[{ name: t('server.used'), value: finitePercent ?? 0 }, { name: t('server.available'), value: 100 - (finitePercent ?? 0) }]}
          valueFormatter={number => `${number.toFixed(1)}%`} showTooltip={finitePercent != null} />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums text-fg">{finitePercent == null ? '--' : `${finitePercent.toFixed(1)}%`}</span>
      </div>}
      <div className="min-w-0 flex-1">
        {value && <div className="text-2xl font-semibold tracking-tight tabular-nums text-fg">{value}</div>}
        {detail && <p className="mt-1 break-words text-xs leading-relaxed text-muted">{detail}</p>}
        {percent === undefined && <dl className="w-full space-y-4">{series.map(item => <div key={item.key} className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-xs text-muted">{item.label}</dt><dd className="text-xl font-semibold tracking-tight tabular-nums text-fg">{item.current}</dd>
        </div>)}</dl>}
      </div>
    </div>
    {expanded && <div id={id} className="mt-5 border-t border-border pt-4">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] leading-relaxed text-muted"><Info size={14} className="shrink-0" />{hint || t('server.chartHint')}</div>
      {hasData ? <AreaChart className="!h-48" data={data} index="time" categories={series.map(item => item.label)} colors={series.map(item => item.color)}
        valueFormatter={formatter} minValue={0} maxValue={percent !== undefined ? 100 : undefined}
        showLegend={series.length > 1} showTooltip showGridLines startEndOnly connectNulls={false} yAxisWidth={66} fill="gradient" />
        : <div className="flex h-48 items-center justify-center text-xs text-muted">{t('server.noChartData')}</div>}
    </div>}
  </section>
}
