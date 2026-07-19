import { Card, Button, Tag } from 'tdesign-react'
import { LocationIcon, UserIcon, ArrowLeftIcon, CalendarIcon } from 'tdesign-icons-react'
import { useNavigate } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import 'tdesign-react/es/style/index.css'
import './4years.css'

function FourYearsEvent() {
  const navigate = useNavigate()

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
                alt="4周年庆典Logo"
                className="mc-hero-logo"
              />
              <div className="mc-hero-text">
                <Tag theme="default" variant="light" shape="round" size="large" className="mc-badge">
                  已结束
                </Tag>
                <h1 className="mc-title">晏阳城市建设 x 晏阳轨道交通 4周年庆典</h1>
                <p className="mc-subtitle">四年风雨 · 感谢有你相伴</p>
              </div>
            </div>
            <div className="mc-meta">
              <div className="mc-meta-item">
                <CalendarIcon />
                <span>2026年7月16日</span>
              </div>
              <div className="mc-meta-divider"></div>
              <div className="mc-meta-item">
                <LocationIcon />
                <span>Minecraft 晏阳服务器</span>
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
                <h2>活动简介</h2>
              </div>
              <div className="mc-card-body">
                <p>
                  2026年7月16日，晏阳城市建设 x 晏阳轨道交通 将迎来成立4周年的重要时刻!在这特殊的日子里，我们诚邀所有新老成员共同参与这场盛大的庆典活动。
                </p>
                <p>
                  四年来，晏阳从一个小小的创意发展为拥有19条地铁线路、100+活跃成员的成熟社区。每一次建设、每一段轨道，都凝聚着大家的汗水与热爱。
                </p>
                <p>
                  本次庆典将包含开放服务器参观、互动小游戏等丰富环节，让我们一起回顾过去四年的精彩瞬间，共同展望更加美好的未来!
                </p>
              </div>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={150}>
            <Card className="mc-card mc-live" hoverShadow>
              <div className="mc-card-header">
                <div className="mc-icon-circle mc-icon-red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10,8 16,12 10,16" fill="white" />
                  </svg>
                </div>
                <h2>官方直播</h2>
                <Tag theme="primary" variant="light" shape="round" size="small" className="mc-live-tag">
                  ● 未开播
                </Tag>
              </div>
              <div className="mc-card-body">
                <div className="mc-live-container">
                  <div className="mc-live-placeholder">
                    {/* <div className="mc-live-preview">
                      <iframe
                        src=""
                        allowFullScreen
                        title="晏阳4周年庆典官方直播"
                        className="mc-live-iframe"
                        allow="autoplay; encrypted-media"
                      ></iframe>
                    </div> */}
                    <div className="mc-live-info">
                      <p className="mc-live-desc">晏阳4周年庆典 · 现场直播</p>
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
                <div className="mc-icon-circle mc-icon-green">
                  <LocationIcon size="24px" />
                </div>
                <h2>如何参与</h2>
              </div>
              <div className="mc-card-body">
                <div className="mc-steps">
                  <div className="mc-step">
                    <div className="mc-step-number">1</div>
                    <div className="mc-step-content">
                      <h3>加入QQ群</h3>
                      <p>加入晏阳官方QQ群 486029013，获取最新活动通知与参与方式</p>
                    </div>
                  </div>
                  <div className="mc-step">
                    <div className="mc-step-number">2</div>
                    <div className="mc-step-content">
                      <h3>准备游戏客户端</h3>
                      <p>游戏客户端将在QQ群中发布，请使用官方客户端进入游戏。</p>
                    </div>
                  </div>
                  <div className="mc-step">
                    <div className="mc-step-number">3</div>
                    <div className="mc-step-content">
                      <h3>准时参与活动</h3>
                      <p>在活动当天准时上线，推荐提前30分钟进入游戏防止出问题错过开场。</p>
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
            返回活动列表
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FourYearsEvent