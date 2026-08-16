import { useCallback, useEffect, useState } from 'react'
import { Cpu, Memory, HardDrives, ArrowClockwise, WarningCircle } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { API_BASE_URL } from '../config'
import { useLanguageContext } from '../i18n/LanguageContext'
import type { TFunction } from '../i18n'
import type { ServerStats } from '../types'

interface StatsResponse {
  success: boolean
  configured: boolean
  data?: ServerStats | null
  message?: string
}

const REFRESH_INTERVAL = 5000

function formatGb(bytes: number): string {
  return (bytes / 2 ** 30).toFixed(1)
}

function formatUptime(seconds: number, t: TFunction): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}${t('server.days')} ${h}${t('server.hours')} ${m}${t('server.minutes')}`
}

interface StatCardProps {
  icon: Icon
  title: string
  percent: number | null
  detail: string
  color: string
}

function StatCard({ icon: Icon, title, percent, detail, color }: StatCardProps) {
  const width = Math.min(100, Math.max(0, percent ?? 0))
  return (
    <div className="bg-surface rounded-container border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} weight="bold" />
        </div>
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        <span className="ml-auto text-2xl font-extrabold text-fg">
          {percent != null ? `${percent.toFixed(1)}%` : 'Null'}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-border/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-muted break-all">{detail}</p>
    </div>
  )
}

export default function Server() {
  const { t } = useLanguageContext()
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/server/stats`)
      const data = await res.json() as StatsResponse
      if (data.success && data.data) {
        setStats(data.data)
        setConfigured(true)
        setError('')
        setLastUpdate(Date.now())
      } else if (data.configured === false) {
        setConfigured(false)
        setError('')
      } else {
        setConfigured(true)
        setError(data.message || t('server.offline'))
      }
    } catch {
      setConfigured(true)
      setError(t('server.offline'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchStats()
    const timer = setInterval(fetchStats, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [fetchStats])

  const cpu = stats?.cpu
  const memory = stats?.memory
  const disk = stats?.disk

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('server.title')}</h1>
            <p className="mt-3 text-muted">{t('server.desc')}</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all disabled:opacity-50"
            >
              <ArrowClockwise size={16} weight="bold" />
              {t('server.refresh')}
            </button>
            {lastUpdate && (
              <span className="text-xs text-muted/60">
                {t('server.lastUpdate')} {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {!configured && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 text-sm rounded-btn flex items-center gap-2">
              <WarningCircle size={18} weight="bold" />
              {t('server.notConfigured')}
            </div>
          )}

          {configured && error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
              <WarningCircle size={18} weight="bold" />
              {error}
            </div>
          )}

          {loading && !stats && (
            <div className="text-center py-12">
              <p className="text-muted">{t('server.loading')}</p>
            </div>
          )}

          {!loading && (
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                  icon={Cpu}
                  title={t('server.cpu')}
                  percent={cpu?.usagePercent != null ? cpu.usagePercent : null}
                  detail={stats ? [cpu?.model, cpu?.cores != null ? `${cpu.cores} ${t('server.cores')}` : '']
                    .filter(Boolean)
                    .join(' · ') : 'Null'}
                  color="bg-blue-500"
                />
                <StatCard
                  icon={Memory}
                  title={t('server.memory')}
                  percent={memory?.percent != null ? memory.percent : null}
                  detail={
                    stats && memory && memory.total != null
                      ? `${formatGb(memory.used ?? 0)} / ${formatGb(memory.total)} ${t('server.gb')}`
                      : 'Null'
                  }
                  color="bg-orange-500"
                />
                <StatCard
                  icon={HardDrives}
                  title={t('server.disk')}
                  percent={disk?.percent != null ? disk.percent : null}
                  detail={
                    stats && disk && disk.total != null
                      ? `${formatGb(disk.used ?? 0)} / ${formatGb(disk.total)} ${t('server.gb')}`
                      : 'Null'
                  }
                  color="bg-purple-500"
                />
              </div>

              <div className="mt-6 bg-surface rounded-container border border-border p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted mb-1">{t('server.hostname')}</dt>
                    <dd className="font-mono text-fg">{stats?.hostname || 'Null'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted mb-1">{t('server.platform')}</dt>
                    <dd className="text-fg">{stats?.platform || 'Null'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted mb-1">{t('server.uptime')}</dt>
                    <dd className="text-fg">
                      {stats?.uptime != null ? formatUptime(stats.uptime, t) : 'Null'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted mb-1">{t('server.load')}</dt>
                    <dd className="font-mono text-fg">
                      {stats?.load && stats.load.length ? stats.load.map(v => v.toFixed(2)).join(' / ') : 'Null'}
                    </dd>
                  </div>
                </dl>
                {stats?.services && stats.services.length > 0 && (
                  <div className="mt-6 border-t border-border pt-5">
                    <h3 className="text-sm font-semibold text-fg mb-3">{t('server.services')}</h3>
                    <div className="divide-y divide-border border border-border rounded-btn overflow-hidden">
                      {stats.services.map(service => (
                        <div key={service.session} className="flex items-center justify-between px-4 py-3 bg-surface">
                          <span className="flex items-center gap-2.5 text-sm font-medium text-fg">
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                service.running ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                            {service.name}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              service.running ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {service.running ? t('server.running') : t('server.stopped')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {stats && (!stats.services || stats.services.length === 0) && (
                  <div className="mt-6 border-t border-border pt-5">
                    <h3 className="text-sm font-semibold text-fg mb-3">{t('server.services')}</h3>
                    <div className="px-4 py-3 bg-surface border border-border rounded-btn text-sm text-muted">
                      Null
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  )
}
