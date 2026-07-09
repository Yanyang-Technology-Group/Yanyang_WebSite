import { Link } from 'react-router-dom'
import { Buildings, Train, ShieldCheck, ArrowRight } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            晏阳城市建设
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80">
            用方块构筑城市与轨道的梦想
          </p>
          <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl mx-auto">
            专为热爱城市规划与轨道交通的创造者打造的 Minecraft 公益服务器
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/join"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-btn text-sm hover:bg-white/95 active:scale-[0.97] transition-transform"
            >
              立即加入 <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-white/90 font-medium rounded-btn text-sm border border-white/20 hover:bg-white/10 active:scale-[0.97] transition-transform"
            >
              了解更多
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">100+</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">活跃成员</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">19</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">条地铁线路</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">7</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">座换乘枢纽</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">4 年</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">持续运营</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">服务器亮点</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-fg">专业建造 · 公益社区 · 稳定运营</h2>
          </div>

          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Buildings,
                  title: '城市规划建设',
                  desc: '从一砖一瓦到整座城市，自由规划道路、街区和地标建筑，打造你心中的理想城市。',
                },
                {
                  icon: Train,
                  title: '立体轨道交通',
                  desc: '高铁、地铁、轻轨全覆盖，构建跨城交通网络，实现一站直达的便捷通行体验。',
                },
                {
                  icon: ShieldCheck,
                  title: '稳定安全运维',
                  desc: '每日自动备份，崩溃快速恢复，严格维护公平创作环境，保障你的每一份建筑成果。',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-bg rounded-container p-6 sm:p-8 text-center border border-border"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-primary-light text-primary mb-4">
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className="text-base font-semibold text-fg mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">社群数据</span>
          <ScrollReveal>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: '50+', label: '活跃玩家' },
                { value: '4', label: '年持续运营' },
                { value: '7', label: '座换乘站' },
                { value: '120+', label: '社群成员' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl sm:text-4xl font-extrabold text-fg">{value}</div>
                  <div className="mt-1 text-sm text-muted">{label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fg">准备好加入了吗？</h2>
          <p className="mt-2 text-muted">加入 QQ 群，获取白名单，开始你的城市建造之旅</p>
          <Link
            to="/join"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-btn text-sm hover:bg-accent/90 active:scale-[0.97] transition-transform"
          >
            立即加入 <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </section>
    </>
  )
}
