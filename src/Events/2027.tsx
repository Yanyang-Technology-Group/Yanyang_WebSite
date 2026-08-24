import { Card, Button, Tag } from 'tdesign-react'
import { LocationIcon, UserIcon, ArrowLeftIcon, CalendarIcon } from 'tdesign-icons-react'
import { useNavigate } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'
import 'tdesign-react/es/style/index.css'
import './4years.css'
import './2027.css'

function NewYear2027Event() {
  const navigate = useNavigate()
  const { t } = useLanguageContext()

  return (
    <div className="mc-event-page">
      <div className="mc-background">
        <div
          className="mc-background-image"
          style={{
            backgroundImage: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 45%, #f59e0b 100%)',
          }}
        ></div>
        <div className="mc-overlay"></div>
      </div>

      <div className="mc-content">
        <div className="mc-hero">
          <ScrollReveal>
          <div className="mc-hero-card">
            <div className="mc-hero-header">
              <div className="mc-hero-logo mc-hero-logo-2027">
                <span>2027</span>
              </div>
              <div className="mc-hero-text">
                <Tag theme="default" variant="light" shape="round" size="large" className="mc-badge">
                  {t('newyear2027.upcoming')}
                </Tag>
                <h1 className="mc-title">{t('newyear2027.title')}</h1>
                <p className="mc-subtitle">{t('newyear2027.subtitle')}</p>
              </div>
            </div>
            <div className="mc-meta">
              <div className="mc-meta-item">
                <CalendarIcon />
                <span>{t('newyear2027.date')}</span>
              </div>
              <div className="mc-meta-divider"></div>
              <div className="mc-meta-item">
                <LocationIcon />
                <span>{t('newyear2027.location')}</span>
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
                <div className="mc-icon-circle mc-icon-2027">
                  <UserIcon size="24px" />
                </div>
                <h2>{t('newyear2027.introTitle')}</h2>
              </div>
              <div className="mc-card-body">
                <p>{t('newyear2027.intro1')}</p>
                <p>{t('newyear2027.intro2')}</p>
                <p>{t('newyear2027.intro3')}</p>
              </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={150}>
            <Card className="mc-card mc-live" hoverShadow>
              <div className="mc-card-header">
                <div className="mc-icon-circle mc-icon-2027">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10,8 16,12 10,16" fill="white" />
                  </svg>
                </div>
                <h2>{t('newyear2027.liveTitle')}</h2>
                <Tag theme="primary" variant="light" shape="round" size="small" className="mc-live-tag">
                  {t('newyear2027.liveTag')}
                </Tag>
              </div>
              <div className="mc-card-body">
                <div className="mc-live-container">
                  <div className="mc-live-placeholder">
                    <div className="mc-live-info">
                      <p className="mc-live-desc">{t('newyear2027.liveDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            </ScrollReveal>
          </div>

            <ScrollReveal delay={200}>
            <Card className="mc-card mc-join" hoverShadow>
              <div className="mc-card-header">
                <div className="mc-icon-circle mc-icon-2027">
                  <LocationIcon size="24px" />
                </div>
                <h2>{t('newyear2027.joinTitle')}</h2>
              </div>
              <div className="mc-card-body">
                <div className="mc-steps">
                  <div className="mc-step">
                    <div className="mc-step-number mc-step-number-2027">1</div>
                    <div className="mc-step-content">
                      <h3>{t('newyear2027.step1Title')}</h3>
                      <p>{t('newyear2027.step1Desc')}</p>
                    </div>
                  </div>
                  <div className="mc-step">
                    <div className="mc-step-number mc-step-number-2027">2</div>
                    <div className="mc-step-content">
                      <h3>{t('newyear2027.step2Title')}</h3>
                      <p>{t('newyear2027.step2Desc')}</p>
                    </div>
                  </div>
                  <div className="mc-step">
                    <div className="mc-step-number mc-step-number-2027">3</div>
                    <div className="mc-step-content">
                      <h3>{t('newyear2027.step3Title')}</h3>
                      <p>{t('newyear2027.step3Desc')}</p>
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
            {t('newyear2027.back')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NewYear2027Event
