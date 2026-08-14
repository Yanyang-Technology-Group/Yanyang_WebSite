// pages/Download.tsx
import { useNavigate } from 'react-router-dom'
import { Package, Coffee, Rocket, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal'
import { useAuth } from '../hooks/useAuth'
import { removeToken } from '../utils/cookie'
import { useLanguageContext } from '../i18n/LanguageContext'
import type { TFunction } from '../i18n'

const TYPES: { id: string; nameKey: string; icon: Icon; descriptionKey: string; color: string; path: string }[] = [
  {
    id: 'modpack',
    nameKey: 'download.t1.name',
    icon: Package,
    descriptionKey: 'download.t1.desc',
    color: 'from-blue-500 to-blue-600',
    path: '/downloads/modpack',
  },
  {
    id: 'java',
    nameKey: 'download.t2.name',
    icon: Coffee,
    descriptionKey: 'download.t2.desc',
    color: 'from-orange-500 to-orange-600',
    path: '/downloads/java',
  },
  {
    id: 'launcher',
    nameKey: 'download.t3.name',
    icon: Rocket,
    descriptionKey: 'download.t3.desc',
    color: 'from-purple-500 to-purple-600',
    path: '/downloads/launcher',
  },
]

function getGreeting(t: TFunction) {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 10) return t('download.greeting.morning')
  if (hour >= 11 && hour <= 12) return t('download.greeting.noon')
  if (hour >= 13 && hour <= 16) return t('download.greeting.afternoon')
  if (hour >= 17 && hour <= 18) return t('download.greeting.evening')
  if (hour >= 19 && hour <= 23) return t('download.greeting.night')
  return t('download.greeting.late')
}

function getRandomPhrase(t: TFunction) {
  const hour = new Date().getHours()
  let group = 'm'
  if (hour >= 11 && hour <= 12) group = 'n'
  else if (hour >= 13 && hour <= 16) group = 'a'
  else if (hour >= 17 && hour <= 18) group = 'e'
  else if (hour >= 19 && hour <= 23) group = 't'
  else if (hour >= 0 && hour <= 4) group = 'l'
  const key = `${group}${Math.floor(Math.random() * 11) + 1}`
  return t(`download.phrases.${key}`)
}

export default function DownloadPage() {
  const navigate = useNavigate()
  const { t } = useLanguageContext()
  const { loading } = useAuth()
  const [greeting, setGreeting] = useState('')
  const [phrase, setPhrase] = useState('')
  const [userLabel, setUserLabel] = useState('')

  useEffect(() => {
    setGreeting(getGreeting(t))
    setPhrase(getRandomPhrase(t))
    const label = localStorage.getItem('user_label')
    if (label) setUserLabel(label)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleReVerify() {
    removeToken()
    localStorage.removeItem('user_label')
    navigate('/verify', { state: { from: '/download' } })
  }

  if (loading) {
    return (
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-muted">{t('download.verifying')}</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex flex-col items-start mb-2 pl-1">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleReVerify}
                className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1.5 bg-transparent border-transparent"
              >
                <ArrowCounterClockwise size={16} weight="bold" />
                {t('download.reverify')}
              </button>
              <span className="text-sm text-muted/60">{greeting}</span>
              {userLabel && <span className="text-sm text-primary font-medium">{userLabel}</span>}
            </div>
            <span className="text-xs text-muted/40 mt-0.5 pl-1">{phrase}</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('download.title')}</h1>
            <p className="mt-3 text-muted">{t('download.desc')}</p>
          </div>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <div
                    key={type.id}
                    onClick={() => navigate(type.path)}
                    className="group bg-surface rounded-container border border-border p-8 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${type.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={28} weight="bold" />
                    </div>
                    <h3 className="text-xl font-bold text-fg mb-2">{t(type.nameKey)}</h3>
                    <p className="text-sm text-muted leading-relaxed mb-4">{t(type.descriptionKey)}</p>
                    <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                      <span>{t('download.view')}</span>
                      <ArrowRight size={16} weight="bold" />
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
