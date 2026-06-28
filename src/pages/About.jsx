import { Buildings, Train, Star, Rocket } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

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
  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">关于晏阳</h1>
          <p className="mt-3 text-muted">
            一个以城市建设与轨道交通为核心的 Minecraft 创作社群，汇聚来自多地的爱好者共同筑梦。
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-16">
          {[
            {
              icon: Buildings,
              title: '我们是谁',
              content: [
                '晏阳城市建设 × 晏阳轨道交通是一个以 Minecraft Java Edition 1.20.1 和 Minecraft Transit Railway 4 为核心，集城市建设和轨道交通为一体的 Minecraft 服务器。',
                '成立于 2022 年 7 月 16 日，至今已汇聚众多成员，涵盖城市规划、建筑设计、轨道交通、运营维护等多个领域的爱好者。',
              ],
            },
            {
              icon: Train,
              title: '轨道交通',
              content: [
                '作为服务器的核心灵魂，晏阳轨道交通已建成覆盖全域的一体化公共交通网络。截至目前，已开通运营 19 条地铁线路，建成换乘枢纽 7 座，实现了市区 20 分钟出行圈。',
              ],
            },
            {
              icon: Star,
              title: '社群理念',
              content: [
                '我们始终秉持开放、包容、共创的社群理念。晏阳从不是少数人的创作秀场，而是每一位爱好者都能施展才华的平台。无论你是建筑大佬还是造城新手，都能在这里找到属于自己的位置。',
              ],
            },
            {
              icon: Rocket,
              title: '未来展望',
              content: [
                '未来，晏阳将继续推进城市南拓及西拓片区、新城市的开发建设，完善城市功能配套，打造更多兼具设计感与辨识度的城市地标。同时持续深化轨道交通线网的优化升级，推进市域铁路网、城际铁路的建设，打造更具真实感、更丰富多元的轨交出行体验。',
              ],
            },
          ].map(({ icon: Icon, title, content }, i) => (
            <ScrollReveal key={title} delay={i * 80}>
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-card bg-primary-light text-primary flex items-center justify-center mt-0.5">
                  <Icon size={20} weight="bold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-fg mb-3">{title}</h2>
                  {content.map((p, j) => (
                    <p key={j} className="text-muted leading-relaxed mb-3 last:mb-0">{p}</p>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Transit numbers */}
      <section className="bg-primary py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white">轨道交通数据</h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              { value: '19', label: '地铁线路' },
              { value: '7', label: '换乘枢纽' },
              { value: '20min', label: '市区出行圈' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-white">{value}</div>
                <div className="mt-1 text-sm text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-bg py-section">
        <div className="px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-fg">合作伙伴</h2>
            <p className="mt-2 text-sm text-muted">感谢以下伙伴的支持与合作</p>
          </div>
          <ScrollReveal>
            <div className="overflow-hidden">
              <div className="flex gap-8 animate-scroll">
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
                      alt={`合作伙伴 ${p.id}`}
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
