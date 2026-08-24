import { Card, Button, Tag } from 'tdesign-react'
import { LocationIcon, UserIcon, ArrowLeftIcon, CalendarIcon } from 'tdesign-icons-react'
import { useNavigate } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'
import 'tdesign-react/es/style/index.css'
import './4years.css'

function FourYearsEvent() {
  const navigate = useNavigate()
  const { t } = useLanguageContext()

  return (
    <div className="mc-event-page">
      <div className="mc-background">
        <div
          className="mc-background-image"
          style={{
            backgroundImage: 'url(/images/events/88c6ced5-23d5-4da5-8db6-c7828c11e7b4.png)',
          }}
        ></div>
        <div className="mc-overlay"></div>
      </div>

      <div className="mc-content">
        <div className="mc-hero">
          <ScrollReveal>
          <div className="mc-hero-card">
            <div className="mc-hero-header">
              <img
                src="/images/events/4yearslogo.png"
                alt="4th anniversary logo"
                className="mc-hero-logo"
              />
              <div className="mc-hero-text">
                <Tag theme="default" variant="light" shape="round" size="large" className="mc-badge">
                  {t('fouryears.ended')}
                </Tag>
                <h1 className="mc-title">{t('fouryears.title')}</h1>
                <p className="mc-subtitle">{t('fouryears.subtitle')}</p>
              </div>
            </div>
            <div className="mc-meta">
              <div className="mc-meta-item">
                <CalendarIcon />
                <span>{t('fouryears.date')}</span>
              </div>
              <div className="mc-meta-divider"></div>
              <div className="mc-meta-item">
                <LocationIcon />
                <span>{t('fouryears.location')}</span>
              </div>
            </div>
          </div>
          </ScrollReveal>
        </div>

        <div className="mc-grid">
          <div className="mc-column mc-left">
            <ScrollReveal delay={100}>
            <Card className="mc-card mc-intro" hoverShadow>
              <div className="mc-card-header">
                <div className="mc-icon-circle">
                  <UserIcon size="24px" />
                </div>
                <h2>{t('fouryears.introTitle')}</h2>
              </div>
              <div className="mc-card-body">
                <p>{t('fouryears.intro1')}</p>
                <p>{t('fouryears.intro2')}</p>
                <p>{t('fouryears.intro3')}</p>
              </div>
              </Card>
            </ScrollReveal>
          </div>

            <ScrollReveal delay={200}>
            <Card className="mc-card mc-join" hoverShadow>
              <div className="mc-card-header">
                <div className="mc-icon-circle mc-icon-green">
                  <LocationIcon size="24px" />
                </div>
                <h2>{t('fouryears.joinTitle')}</h2>
              </div>
              <div className="mc-card-body">
                <div className="mc-steps">
                  <div className="mc-step">
                    <div className="mc-step-number">1</div>
                    <div className="mc-step-content">
                      <h3>{t('fouryears.step1Title')}</h3>
                      <p>{t('fouryears.step1Desc')}</p>
                    </div>
                  </div>
                  <div className="mc-step">
                    <div className="mc-step-number">2</div>
                    <div className="mc-step-content">
                      <h3>{t('fouryears.step2Title')}</h3>
                      <p>{t('fouryears.step2Desc')}</p>
                    </div>
                  </div>
                  <div className="mc-step">
                    <div className="mc-step-number">3</div>
                    <div className="mc-step-content">
                      <h3>{t('fouryears.step3Title')}</h3>
                      <p>{t('fouryears.step3Desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            </ScrollReveal>
        </div>

        <div className="mc-back">
          <Button
            theme="default"
            size="large"
            shape="round"
            icon={<ArrowLeftIcon />}
            onClick={() => navigate('/event')}
            className="mc-back-btn"
          >
            {t('fouryears.back')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FourYearsEvent
