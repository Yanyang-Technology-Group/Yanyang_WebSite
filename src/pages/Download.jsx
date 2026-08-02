import { useNavigate } from 'react-router-dom'
import { Package, Coffee, Rocket, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { useAuth } from '../hooks/useAuth'

const TYPES = [
  {
    id: 'modpack',
    name: '整合包',
    icon: Package,
    description: '晏阳城市建设专用整合包',
    color: 'from-blue-500 to-blue-600',
    path: '/downloads/modpack'
  },
  {
    id: 'java',
    name: 'JDK',
    icon: Coffee,
    description: 'Java 运行环境，Minecraft 运行必备',
    color: 'from-orange-500 to-orange-600',
    path: '/downloads/java'
  },
  {
    id: 'launcher',
    name: '启动器',
    icon: Rocket,
    description: 'Minecraft 游戏启动器',
    color: 'from-purple-500 to-purple-600',
    path: '/downloads/launcher'
  }
]

export default function DownloadPage() {
  const navigate = useNavigate()
  const { loading } = useAuth()

  function handleReVerify() {
    document.cookie = 'download_token=; path=/; max-age=0'
    navigate('/verify', { state: { from: '/download' } })
  }

  if (loading) {
    return (
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-muted">验证中...</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleReVerify}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-colors"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              重新验证
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">资源下载</h1>
            <p className="mt-3 text-muted">选择你要下载的资源类型</p>
          </div>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <div
                    key={type.id}
                    onClick={() => navigate(type.path)}
                    className="group bg-surface rounded-container border border-border p-8 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${type.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={28} weight="bold" />
                    </div>
                    <h3 className="text-xl font-bold text-fg mb-2">{type.name}</h3>
                    <p className="text-sm text-muted leading-relaxed mb-4">{type.description}</p>
                    <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                      <span>查看下载</span>
                      <ArrowRight size={16} weight="bold" />
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}