import { Buildings, Train, Star, Rocket } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'

const PARTNERS = [
  { id: 1, url: 'https://rail.yanyn.cn' },
  { id: 2, url: 'https://tech.yanyn.cn' },
  { id: 3, url: 'https://www.yanyn.cn/404' },
  { id: 4, url: 'https://www.yanyn.cn/404' },
  { id: 5, url: 'https://www.yanyn.cn/404' },
  { id: 6, url: 'https://www.yanyn.cn/404' },
  { id: 7, url: 'https://www.yanyn.cn/404' },
  { id: 8, url: 'https://jjmm.ink' },
]

export default function About() {
  const { t } = useLanguageContext()
  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('about.hero.title')}</h1>
          <p className="mt-3 text-muted">
            {t('about.hero.desc')}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-16">
          {[
            { icon: Buildings, titleKey: 'about.who.title', contentKeys: ['about.who.p1', 'about.who.p2'] },
            { icon: Train, titleKey: 'about.rail.title', contentKeys: ['about.rail.p1'] },
            { icon: Star, titleKey: 'about.idea.title', contentKeys: ['about.idea.p1'] },
            { icon: Rocket, titleKey: 'about.future.title', contentKeys: ['about.future.p1'] },
          ].map(({ icon: Icon, titleKey, contentKeys }, i) => (
            <ScrollReveal key={titleKey} delay={i * 80}>
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-card bg-primary-light text-primary flex items-center justify-center mt-0.5">
                  <Icon size={20} weight="bold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-fg mb-3">{t(titleKey)}</h2>
                  {contentKeys.map((key, j) => (
                    <p key={j} className="text-muted leading-relaxed mb-3 last:mb-0">{t(key)}</p>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Transit numbers */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-fg">{t('about.data.title')}</h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              { value: '19', key: 'about.data.i1' },
              { value: '7', key: 'about.data.i2' },
              { value: '20min', key: 'about.data.i3' },
            ].map(({ value, key }) => (
              <div key={key}>
                <div className="text-3xl sm:text-4xl font-extrabold text-fg">{value}</div>
                <div className="mt-1 text-sm text-muted">{t(key)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <div className="bg-white h-2" />
      <section className="bg-primary py-section">
        <div className="px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-white">{t('about.partners.title')}</h2>
            <p className="mt-2 text-sm text-white/70">{t('about.partners.desc')}</p>
          </div>
          <ScrollReveal>
            <div className="overflow-hidden bg-white w-full mx-auto">
              <div className="flex gap-12 animate-scroll">
                {[...PARTNERS, ...PARTNERS].map((p, i) => (
                  <a
                    key={`${p.id}-${i}`}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-40 h-20 sm:w-48 sm:h-24 bg-white flex items-center justify-center p-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={`/images/us/${p.id}.png`}
                      alt={t('about.partners.alt', { id: p.id })}
                      className="max-h-full max-w-full object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
