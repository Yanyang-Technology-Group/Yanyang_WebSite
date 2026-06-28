import { useState } from 'react'
import { ChatTeardropText, Article, Play, Desktop, Gear, User, Envelope, Cpu, DeviceMobileCamera, HardDrives, WifiHigh } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(
    () => {
      const el = document.createElement('div')
      el.textContent = `已复制${label}: ${text}`
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-fg text-white text-sm px-4 py-2 rounded-btn shadow-none z-50'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    },
    () => {
      const el = document.createElement('div')
      el.textContent = '复制失败，请手动复制'
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-fg text-white text-sm px-4 py-2 rounded-btn shadow-none z-50'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  )
}

export default function Join() {
  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">加入晏阳</h1>
          <p className="mt-3 text-muted">
            在 Minecraft 里亲手搭建梦想都市，与志同道合的伙伴一起创造属于你的城市传奇。
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              {[
                {
                  step: 1,
                  icon: ChatTeardropText,
                  title: '加入 QQ 群',
                  desc: '通过下方按钮加入 QQ 交流群，与管理员取得联系。',
                  highlight: true,
                },
                {
                  step: 2,
                  icon: Article,
                  title: '提交申请',
                  desc: '在群内阅读入服须知，按要求填写入服申请表。',
                  highlight: false,
                },
                {
                  step: 3,
                  icon: Play,
                  title: '开始创作',
                  desc: '审核通过后即可进入服务器，开启你的城市建设之旅。',
                  highlight: false,
                },
              ].map(({ step, icon: Icon, title, desc, highlight }) => (
                <div
                  key={step}
                  className={`flex-1 p-6 rounded-container border text-center ${
                    highlight
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg border-border text-fg'
                  }`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-card mb-4 ${
                      highlight ? 'bg-white/20 text-white' : 'bg-primary-light text-primary'
                    }`}
                  >
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className={`text-lg font-bold ${highlight ? 'text-white' : 'text-fg'} mb-2`}>
                    {step}. {title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${highlight ? 'text-white/70' : 'text-muted'}`}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <div className="mt-8 text-center">
            <a
              href="https://qm.qq.com/q/aBSDTnmJhK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
            >
              <ChatTeardropText size={18} weight="bold" />
              加入 QQ 群聊
            </a>
          </div>
        </div>
      </section>

      {/* Server Info */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal delay={80}>
            <h2 className="text-xl font-bold text-fg mb-6">服务器信息</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Desktop, label: '游戏版本', value: 'Java 1.20.1' },
                { icon: Gear, label: '核心框架', value: 'Fabric + MTR 4' },
                { icon: User, label: 'QQ 群号', value: '486029013', copyable: true },
                { icon: Envelope, label: '反馈邮箱', value: 'feedback@yanyn.cn', copyable: true },
              ].map(({ icon: Icon, label, value, copyable }) => (
                <div
                  key={label}
                  className={`bg-bg rounded-container p-4 border border-border ${
                    copyable ? 'cursor-pointer hover:border-primary/30 active:scale-[0.97] transition-all' : ''
                  }`}
                  onClick={() => copyable && copyToClipboard(value, label)}
                  title={copyable ? `点击复制${label}` : undefined}
                >
                  <Icon size={20} weight="bold" className="text-primary mb-2" />
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className="text-sm font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <h2 className="text-xl font-bold text-fg mt-8 mb-6">硬件配置</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Cpu, label: '处理器', value: 'E5-2698B V3 16C32T' },
                { icon: DeviceMobileCamera, label: '内存', value: '32GB DDR3 1866MHz' },
                { icon: HardDrives, label: '存储', value: '512GB NVMe SSD' },
                { icon: WifiHigh, label: '网络', value: '1000M↓ / 80M↑' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-bg rounded-container p-4 border border-border">
                  <Icon size={20} weight="bold" className="text-primary mb-2" />
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className="text-sm font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <h2 className="text-xl font-bold text-fg mt-8 mb-6">技术服务</h2>
            <div className="flex flex-wrap items-center gap-8">
              <a href="https://www.passnat.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-surface rounded-container hover:bg-gray-100 transition-colors">
                <img src="/images/join/frplogo.png" alt="FRP" className="h-8 w-auto" />
                <span className="text-sm font-medium text-fg">FRP 内网穿透</span>
              </a>
              <a href="https://www.rainyun.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-surface rounded-container hover:bg-gray-100 transition-colors">
                <img src="/images/join/webserver.png" alt="云服务" className="h-8 w-auto" />
                <span className="text-sm font-medium text-fg">网站云服务</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal delay={240}>
            <h2 className="text-xl font-bold text-fg mb-6">常见问题</h2>
            <div className="divide-y divide-border border border-border rounded-container bg-bg">
              {[
                { q: '需要正版 Minecraft 才能加入吗？', a: '不需要，服务器支持离线登录，没有正版也可以加入游玩。' },
                { q: '对建筑水平有要求吗？', a: '没有硬性要求！无论你是建筑大佬还是新手，只要热爱城市建设，都欢迎加入。社群内有经验丰富的玩家可以提供指导。' },
                { q: '服务器有哪些规则？', a: '主要包括：禁止使用外挂/熊服、尊重他人建筑作品、遵守城市规划布局等。详细规则将在 QQ 群内公布。' },
                { q: '审核需要多长时间？', a: '通常管理员会在 24 小时内处理你的入服申请，高峰期可能稍有延迟。' },
              ].map(({ q, a }) => (
                <FAQItem key={q} question={q} answer={a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-fg hover:bg-surface/50 transition-colors"
      >
        {question}
        <span className={`ml-4 transition-transform text-muted ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-muted leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}
