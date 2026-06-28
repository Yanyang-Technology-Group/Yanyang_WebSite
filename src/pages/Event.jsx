import { useNavigate } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'

const EVENTS = [
  {
    date: '2026 年 7 月 16 日',
    title: '晏阳 4 周年庆典',
    desc: '庆祝晏阳成立 4 周年，开展公开参观及游戏活动。',
    tag: '即将开始',
    link: '/events/official/minecraft/4years',
    active: true,
  },
]

export default function Event() {
  const navigate = useNavigate()

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">活动与动态</h1>
          <p className="mt-3 text-muted">
            晏阳城市建设的最新动态、版本更新与社群活动
          </p>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {EVENTS.map((event, i) => (
                <div
                  key={i}
                  className={`relative pb-10 last:pb-0 ${event.link ? 'cursor-pointer' : ''}`}
                  onClick={() => event.link && navigate(event.link)}
                >
                  <div
                    className={`absolute left-[-30px] top-1.5 w-[22px] h-[22px] rounded-full border-2 ${
                      event.active
                        ? 'bg-primary border-primary'
                        : 'bg-bg border-border'
                    }`}
                  />
                  <div className="text-xs font-medium text-muted mb-1">{event.date}</div>
                  <h3
                    className={`text-lg font-bold mb-1 ${
                      event.active ? 'text-fg' : 'text-muted'
                    }`}
                  >
                    {event.title}
                  </h3>
                  <p className={`text-sm ${event.active ? 'text-muted' : 'text-muted/50'}`}>
                    {event.desc}
                  </p>
                  {event.tag && (
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                        event.active
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-surface text-muted'
                      }`}
                    >
                      {event.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
