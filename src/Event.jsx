import { Timeline, TimelineItem, Tag, Card } from 'tdesign-react'
import { CityIcon, SubwayLineIcon, ServerIcon, InternetIcon, UserIcon, FlagIcon } from 'tdesign-icons-react'
import { RevealSection } from './App.jsx'

const events = [
  {
    date: '2026 年 7 月 16 日',
    title: '晏阳4周年庆典',
    desc: '庆祝晏阳成立4周年，开展公开参观及游戏活动。',
    tag: '未开始',
    tagTheme: 'warning',
    icon: <CityIcon />,
  }
]

function Activity() {
  return (
    <div className="activity-page">
      <div className="page-hero page-hero--gradient">
        <h1>活动与动态</h1>
        <p>晏阳城市建设的最新动态、版本更新与社群活动</p>
      </div>

      <div className="page-content timeline-content">
        <RevealSection>
          <Timeline mode="alternate">
            {events.map((event, index) => (
              <TimelineItem
                key={index}
                dot={event.icon}
                dotColor="primary"
              >
                <Card className="timeline-card" hoverShadow>
                  <div className="timeline-date">{event.date}</div>
                  <h3 className="timeline-title">{event.title}</h3>
                  <p className="timeline-desc">{event.desc}</p>
                  <Tag
                    theme={event.tagTheme}
                    variant="light"
                    size="small"
                    shape="round"
                    style={{ marginTop: '12px' }}
                  >
                    {event.tag}
                  </Tag>
                </Card>
              </TimelineItem>
            ))}
          </Timeline>
        </RevealSection>
      </div>
    </div>
  )
}

export default Activity
