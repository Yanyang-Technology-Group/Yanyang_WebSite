import { useNavigate } from 'react-router-dom'
import { Calendar } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'

const EVENTS = [
  {
    dateKey: 'event.date',
    titleKey: 'event.itemTitle',
    descKey: 'event.itemDesc',
    tagKey: 'event.tag',
    link: '/events/official/minecraft/4years',
  },
]

export default function Event() {
  const navigate = useNavigate()
  const { t } = useLanguageContext()

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('event.title')}</h1>
          <p className="mt-3 text-muted">
            {t('event.desc')}
          </p>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid gap-6">
              {EVENTS.map((event, i) => (
                <div
                  key={i}
                  className="group bg-surface rounded-container border border-border hover:border-primary/40 transition-colors overflow-hidden cursor-pointer"
                  onClick={() => event.link && navigate(event.link)}
                >
                  <div className="bg-primary px-6 py-3 flex items-center gap-2 text-white text-sm font-medium">
                    <Calendar size={16} weight="bold" />
                    {t(event.dateKey)}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-fg group-hover:text-primary transition-colors">
                          {t(event.titleKey)}
                        </h3>
                        <p className="mt-2 text-sm text-muted leading-relaxed">{t(event.descKey)}</p>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full">
                        {t(event.tagKey)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
