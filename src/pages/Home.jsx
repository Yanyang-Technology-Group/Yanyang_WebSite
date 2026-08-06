import { Link } from 'react-router-dom'
import { Buildings, Train, ShieldCheck, ArrowRight, Heart } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'

export default function Home() {
  const { t } = useLanguageContext()
  return (
      <>
        {/* Hero */}
        <section className="bg-primary pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              {t('home.hero.title')}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-white/80">
              {t('home.hero.slogan')}
            </p>
            <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl mx-auto">
              {t('home.hero.desc')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                  to="/join"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-btn text-sm hover:bg-white/95 active:scale-[0.97] transition-transform dark:bg-surface dark:text-fg dark:hover:bg-border"
              >
                {t('home.hero.join')} <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white/90 font-medium rounded-btn text-sm border border-white/20 hover:bg-white/10 active:scale-[0.97] transition-transform"
              >
                {t('home.hero.learn')}
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-white">100+</div>
                <div className="mt-1 text-xs sm:text-sm text-white/60">{t('home.stats.members')}</div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-white">19</div>
                <div className="mt-1 text-xs sm:text-sm text-white/60">{t('home.stats.lines')}</div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-white">7</div>
                <div className="mt-1 text-xs sm:text-sm text-white/60">{t('home.stats.hubs')}</div>
              </div>
              <div className="w-px h-10 bg-white/20 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-white">{t('home.stats.yearsValue')}</div>
                <div className="mt-1 text-xs sm:text-sm text-white/60">{t('home.stats.years')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-surface py-section">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t('home.highlights.label')}</span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-fg">{t('home.highlights.title')}</h2>
            </div>

            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { icon: Buildings, titleKey: 'home.highlights.i1.title', descKey: 'home.highlights.i1.desc' },
                  { icon: Train, titleKey: 'home.highlights.i2.title', descKey: 'home.highlights.i2.desc' },
                  { icon: ShieldCheck, titleKey: 'home.highlights.i3.title', descKey: 'home.highlights.i3.desc' },
                ].map(({ icon: Icon, titleKey, descKey }) => (
                    <div
                        key={titleKey}
                        className="bg-bg rounded-container p-6 sm:p-8 text-center border border-border"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-primary-light text-primary mb-4">
                        <Icon size={24} weight="bold" />
                      </div>
                      <h3 className="text-base font-semibold text-fg mb-2">{t(titleKey)}</h3>
                      <p className="text-sm text-muted leading-relaxed">{t(descKey)}</p>
                    </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-bg py-section">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t('home.data.label')}</span>
            <ScrollReveal>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { value: '50+', key: 'home.data.i1' },
                  { value: '4', key: 'home.data.i2' },
                  { value: '7', key: 'home.data.i3' },
                  { value: '120+', key: 'home.data.i4' },
                ].map(({ value, key }) => (
                    <div key={key}>
                      <div className="text-3xl sm:text-4xl font-extrabold text-fg">{value}</div>
                      <div className="mt-1 text-sm text-muted">{t(key)}</div>
                    </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-surface py-section">
          <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fg">{t('home.cta.title')}</h2>
            <p className="mt-2 text-muted">{t('home.cta.desc')}</p>
            <Link
                to="/join"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
            >
              {t('home.cta.join')} <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
        </section>

        {/* Support */}
        <section className="bg-bg py-section">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t('home.support.label')}</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-fg">{t('home.support.title')}</h2>
            <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
              {t('home.support.desc')}
            </p>
            <a
                href="https://ifdian.net/a/YanyangUG"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-fg text-bg font-semibold rounded-btn text-sm hover:bg-muted active:scale-[0.97] transition-transform"
            >
              <Heart size={18} weight="fill" />
              {t('home.support.button')}
            </a>
          </div>
        </section>
      </>
  )
}
