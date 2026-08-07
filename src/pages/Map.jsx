import { useState } from 'react'
import { Link } from 'react-router-dom'
import { House, ArrowLeft, ArrowRight, MapPin } from '@phosphor-icons/react'
import { useLanguageContext } from '../i18n/LanguageContext'

const MAPS = [
  {
    id: 1,
    nameKey: 'map.sat',
    image: '/images/map/1.png',
    path: '/maps/satellite'
  },
  {
    id: 2,
    nameKey: 'map.rail',
    image: '/images/map/2.png',
    path: '/maps/railway'
  }
]

export default function Map() {
  const { t } = useLanguageContext()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [bumpDirection, setBumpDirection] = useState(null)

  const currentMap = MAPS[currentIndex]

  const handlePrev = () => {
    if (isTransitioning) return
    if (currentIndex === 0) {
      setBumpDirection('left')
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setBumpDirection(null)
      }, 400)
      return
    }
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev - 1)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleNext = () => {
    if (isTransitioning) return
    if (currentIndex === MAPS.length - 1) {
      setBumpDirection('right')
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
        setBumpDirection(null)
      }, 400)
      return
    }
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const getBumpClass = () => {
    if (!bumpDirection) return ''
    return bumpDirection === 'left' ? 'bump-left' : 'bump-right'
  }

  return (
    <section className="min-h-screen bg-bg pt-16 pb-10 sm:pt-20 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-xs font-medium text-primary bg-primary-light rounded-full">
            <MapPin size={12} weight="bold" />
            {t('map.label')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('map.title')}</h1>
          <p className="mt-2 text-muted text-sm">{t('map.desc')}</p>
        </div>

        <div className="flex justify-center mb-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all"
          >
            <House size={16} weight="bold" />
            {t('map.back')}
          </Link>
        </div>

        <div className="relative rounded-container overflow-hidden bg-surface border border-border">
          <div className="relative aspect-[16/7] overflow-hidden bg-black/5">
            <div
              className={`flex w-full h-full transition-transform duration-500 ease-in-out ${getBumpClass()}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {MAPS.map((map) => (
                <div key={map.id} className="min-w-full h-full relative flex-shrink-0 overflow-hidden">
                  <div
                    className="w-[120%] h-[120%] bg-cover bg-center map-pan"
                    style={{
                      backgroundImage: `url(${map.image})`,
                      filter: 'blur(4px) saturate(1.1)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 z-10 text-white">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ fontFamily: '"Source Han Sans SC", "Noto Sans SC", sans-serif' }}>
                      {t(map.nameKey)}
                    </h2>
                  </div>
                  <div className="absolute bottom-8 right-8 z-10">
                    <Link
                      to={map.path}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all shadow-lg"
                    >
                      <MapPin size={16} weight="bold" />
                      {t('map.go')}
                    </Link>
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
