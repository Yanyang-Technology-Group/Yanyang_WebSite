import { useNavigate } from 'react-router-dom'
import { Download as DownloadIcon, ArrowRight } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { useAuth } from '../hooks/useAuth'

const VERSIONS = [
  {
    id: '4years',
    name: '4周年纪念版',
    version: 'v4.0.0',
    date: '2026-07-16',
    description: '晏阳城市建设4周年特别版本',
    tag: '最新',
    path: '/downloads/minecraft/modpacks/4years'
  }
]

export default function DownloadPage() {
  const navigate = useNavigate()
  const { loading } = useAuth()

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
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">资源下载</h1>
          <p className="mt-3 text-muted">选择版本查看对应的下载方式</p>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid gap-4">
              {VERSIONS.map((version) => (
                <div
                  key={version.id}
                  onClick={() => navigate(version.path)}
                  className="bg-surface rounded-container border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                        <DownloadIcon size={24} weight="bold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-fg">{version.name}</h3>
                          {version.tag && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                              {version.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted">{version.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          <span>{version.version}</span>
                          <span>•</span>
                          <span>{version.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium">查看下载</span>
                      <ArrowRight size={18} weight="bold" />
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