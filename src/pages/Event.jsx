import { useNavigate } from 'react-router-dom'
import { Calendar } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

const EVENTS = [
  {
    date: '2026 年 7 月 16 日',
    title: '晏阳 4 周年庆典',
    desc: '庆祝晏阳成立 4 周年，开展公开参观及游戏活动。',
    tag: '即将开始',
    link: '/events/official/minecraft/4years',
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
            <div className="grid gap-6">
              {EVENTS.map((event, i) => (
                <div
                  key={i}
                  className="group bg-surface rounded-container border border-border hover:border-primary/40 transition-colors overflow-hidden cursor-pointer"
                  onClick={() => event.link && navigate(event.link)}
                >
                  <div className="bg-primary px-6 py-3 flex items-center gap-2 text-white text-sm font-medium">
                    <Calendar size={16} weight="bold" />
                    {event.date}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-fg group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted leading-relaxed">{event.desc}</p>
                      </div>
                      <span className="flex-shrink-0 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full">
                        {event.tag}
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
