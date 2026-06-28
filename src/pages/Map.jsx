import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, House } from '@phosphor-icons/react'
import { SkeletonBlock } from '../components/Skeleton'

export default function Map() {
  const [loading, setLoading] = useState(true)

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-medium text-primary bg-primary-light rounded-full">
            <MapPin size={12} weight="bold" />
            线路图
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">线路图</h1>
          <p className="mt-3 text-muted">
            实时查看晏阳城市建设服务器的地铁线路，追踪建设进度。
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-fg border border-border rounded-btn hover:bg-surface active:scale-[0.97] transition-all"
            >
              <House size={16} weight="bold" />
              返回首页
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {loading && <SkeletonBlock height="600px" className="rounded-container" />}
          <iframe
            src="https://umap.yanyn.cn/"
            title="线路图"
            className={`w-full h-[600px] sm:h-[700px] border-0 rounded-container bg-surface ${
              loading ? 'hidden' : 'block'
            }`}
            allowFullScreen
            loading="lazy"
            onLoad={() => setLoading(false)}
          />
        </div>
      </section>
    </>
  )
}
