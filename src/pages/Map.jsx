import { useState } from 'react'
import { Link } from 'react-router-dom'
import { House, ArrowLeft, ArrowRight, MapPin } from '@phosphor-icons/react'

const MAPS = [
  {
    id: 1,
    name: '卫星地图',
    url: '/api/map/proxy?target=http://103.40.14.23:28826',
    fallbackUrl: 'http://103.40.14.23:28826'
  },
  {
    id: 2,
    name: '线路图',
    url: '/api/map/proxy?target=http://103.40.14.23:50854',
    fallbackUrl: 'http://103.40.14.23:50854'
  }
]

export default function Map() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [iframeError, setIframeError] = useState(false)

  const currentMap = MAPS[currentIndex]

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev === 0 ? MAPS.length - 1 : prev - 1))
    setIframeError(false)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev === MAPS.length - 1 ? 0 : prev + 1))
    setIframeError(false)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleIframeError = () => {
    setIframeError(true)
  }

  return (
    <section className="min-h-screen bg-bg pt-16 pb-10 sm:pt-20 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-xs font-medium text-primary bg-primary-light rounded-full">
            <MapPin size={12} weight="bold" />
            地图
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">晏阳地图</h1>
          <p className="mt-2 text-muted text-sm">实时查看晏阳城市建设服务器的地图</p>
        </div>

        <div className="flex justify-center mb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all"
          >
            <House size={16} weight="bold" />
            返回首页
          </Link>
        </div>

        <div className="relative rounded-container overflow-hidden bg-surface border border-border">
          <div className="relative aspect-[16/7] overflow-hidden bg-black/5">
            <div
              className={`flex w-full h-full transition-transform duration-500 ease-in-out`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {MAPS.map((map, index) => (
                <div key={map.id} className="min-w-full h-full relative flex-shrink-0">
                  {iframeError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                      <p className="text-muted mb-4">地图加载失败</p>
                      <a
                        href={map.fallbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn hover:bg-primary/90"
                      >
                        <MapPin size={16} weight="bold" />
                        在新窗口打开
                      </a>
                    </div>
                  ) : (
                    <iframe
                      src={map.url}
                      className="w-full h-full border-0"
                      title={map.name}
                      allowFullScreen
                      onError={handleIframeError}
                    />
                  )}
                  <div className="absolute bottom-8 left-8 z-10 text-white pointer-events-none">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold drop-shadow-lg" style={{ fontFamily: '"Source Han Sans SC", "Noto Sans SC", sans-serif' }}>
                      {map.name}
                    </h2>
                  </div>
                  <div className="absolute bottom-8 right-8 z-10">
                    <a
                      href={map.fallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg"
                    >
                      <MapPin size={16} weight="bold" />
                      新窗口打开
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all flex items-center justify-center backdrop-blur-sm"
              disabled={isTransitioning}
            >
              <ArrowLeft size={24} weight="bold" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all flex items-center justify-center backdrop-blur-sm"
              disabled={isTransitioning}
            >
              <ArrowRight size={24} weight="bold" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {MAPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (isTransitioning || index === currentIndex) return
                    setIsTransitioning(true)
                    setCurrentIndex(index)
                    setIframeError(false)
                    setTimeout(() => setIsTransitioning(false), 500)
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex ? 'w-8 bg-primary' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}