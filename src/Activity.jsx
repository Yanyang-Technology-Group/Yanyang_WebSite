import { Timeline, TimelineItem, Tag, Card } from 'tdesign-react'
import { CityIcon, SubwayLineIcon, ServerIcon, InternetIcon, UserIcon, FlagIcon } from 'tdesign-icons-react'
import { RevealSection } from './App.jsx'

const events = [
  {
    date: '2025 年',
    title: '西部新城计划启动',
    desc: '晏阳正式启动西部新城开发建设，规划新增多条地铁线路延伸段，覆盖西部新城片区主要功能区域。',
    tag: '城市建设',
    tagTheme: 'primary',
    icon: <CityIcon />,
  },
  {
    date: '2024 年末',
    title: '轨道交通线网全面升级',
    desc: '完成第 19 条地铁线路的开通运营，建成第 7 座换乘枢纽，实现市区 20 分钟出行圈的目标。',
    tag: '轨道交通',
    tagTheme: 'success',
    icon: <SubwayLineIcon />,
  },
  {
    date: '2024 年',
    title: '服务器迁移至新平台',
    desc: '为提供更稳定的游戏体验，服务器完成基础设施升级，实现每日自动备份与快速故障恢复机制。',
    tag: '技术升级',
    tagTheme: 'warning',
    icon: <ServerIcon />,
  },
  {
    date: '2024 年中',
    title: '官方网站上线',
    desc: '晏阳城市建设官方网站正式上线，提供服务器介绍、加入指引、活动动态等信息展示。',
    tag: '社群建设',
    tagTheme: 'default',
    icon: <InternetIcon />,
  },
  {
    date: '2023 年',
    title: '成员突破 50 人',
    desc: '社群持续壮大，汇聚了来自多地的城市规划、建筑设计、轨道交通等领域爱好者，共同创作。',
    tag: '里程碑',
    tagTheme: 'danger',
    icon: <UserIcon />,
  },
  {
    date: '2022 年 7 月',
    title: '晏阳城市建设成立',
    desc: '晏阳城市建设服务器正式成立，开启了以城市规划与轨道交通为核心的 Minecraft 创作之旅。',
    tag: '起源',
    tagTheme: 'primary',
    icon: <FlagIcon />,
  },
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
