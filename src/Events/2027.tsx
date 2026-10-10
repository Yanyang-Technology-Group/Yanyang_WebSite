import { ArrowLeft, Calendar, MapPin, Users } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'
import './2027.css'

export default function NewYear2027Event() {
  const { t, locale } = useLanguageContext()
  const eventsPath = locale === 'zh-cn' ? '/event' : `/${locale}/event`

  return (
    <div id="newyear-2027" className="ny-event-page">
      <div className="ny-event-background" aria-hidden="true">
        <div className="ny-event-background-image" />
        <div className="ny-event-overlay" />
      </div>

      <div className="ny-event-content">
        <ScrollReveal>
          <header className="ny-card ny-event-hero">
            <div className="ny-card-body ny-event-hero-body">
              <span className="ny-badge ny-badge-warning ny-badge-soft ny-badge-lg">
                {t('event.newYearTag')}
              </span>
              <img
                src="/images/events/2027/logo.png"
                alt={t('newyear2027.logoAlt')}
                className="ny-event-logo"
                width={2000}
                height={842}
                fetchPriority="high"
              />
              <h1 className="ny-event-title">{t('event.newYearTitle')}</h1>
              <p className="ny-event-subtitle">{t('newyear2027.subtitle')}</p>
              <div className="ny-event-meta">
                <span><Calendar size={20} aria-hidden="true" />{t('event.newYearDate')}</span>
                <span><MapPin size={20} aria-hidden="true" />{t('fouryears.location')}</span>
              </div>
            </div>
          </header>
        </ScrollReveal>

        <div className="ny-event-grid">
          <ScrollReveal delay={100} className="ny-event-section">
            <section className="ny-card ny-event-panel" aria-labelledby="ny-intro-title">
              <div className="ny-card-body">
                <div className="ny-event-heading">
                  <span className="ny-event-icon"><Users size={24} aria-hidden="true" /></span>
                  <h2 id="ny-intro-title" className="ny-card-title">{t('fouryears.introTitle')}</h2>
                </div>
                <div className="ny-event-copy">
                  <p>{t('newyear2027.intro1')}</p>
                  <p>{t('newyear2027.intro2')}</p>
                  <p>{t('newyear2027.intro3')}</p>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={200} className="ny-event-section">
            <section className="ny-card ny-event-panel" aria-labelledby="ny-join-title">
              <div className="ny-card-body">
                <div className="ny-event-heading">
                  <span className="ny-event-icon"><MapPin size={24} aria-hidden="true" /></span>
                  <h2 id="ny-join-title" className="ny-card-title">{t('fouryears.joinTitle')}</h2>
                </div>
                <ol className="ny-steps ny-steps-vertical ny-event-steps">
                  {[1, 2, 3].map((step) => (
                    <li key={step} className="ny-step ny-step-primary">
                      <div className="ny-event-step-copy">
                        <h3>{t(`fouryears.step${step}Title`)}</h3>
                        <p>{t(`fouryears.step${step}Desc`)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </ScrollReveal>
        </div>

        <div className="ny-event-back">
          <Link to={eventsPath} className="ny-btn ny-btn-lg ny-event-back-btn">
            <ArrowLeft size={20} aria-hidden="true" />
            {t('fouryears.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
