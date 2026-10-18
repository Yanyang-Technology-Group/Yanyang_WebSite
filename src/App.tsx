import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PageFallback from './components/PageFallback'
import Home from './pages/Home'
import { LanguageProvider, useLanguageContext } from './i18n/LanguageContext'
import { useLanguage } from './hooks/useLanguage'

// 首屏只加载首页；其余路由按需异步加载，避免一次下载 Admin / 活动页 / tdesign 等
// 用不到的资源（首屏 JS 因此减少约一半）。
const About = lazy(() => import('./pages/About'))
const Join = lazy(() => import('./pages/Join'))
const Event = lazy(() => import('./pages/Event'))
const Map = lazy(() => import('./pages/Map'))
const Server = lazy(() => import('./pages/Server'))
const Admin = lazy(() => import('./pages/Admin'))
const FourYearsEvent = lazy(() => import('./Events/4years'))
const NewYear2027Event = lazy(() => import('./Events/2027'))
const SatelliteMap = lazy(() => import('./pages/SatelliteMap'))
const RailwayMap = lazy(() => import('./pages/RailwayMap'))

function ScrollToTop() {
    const location = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [location])
    return null
}

function NotFound() {
    const { t } = useLanguageContext()
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="text-8xl font-extrabold text-primary/30 select-none">{t('notfound.code')}</div>
            <p className="mt-4 text-lg font-medium text-fg">{t('notfound.title')}</p>
            <p className="mt-1 text-sm text-muted">{t('notfound.desc')}</p>
            <Link
                to="/"
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
            >
                {t('notfound.back')}
            </Link>
        </div>
    )
}

function AppContent() {
    const location = useLocation()
    const lang = useLanguage()

    // 路由按去掉语言后缀后的路径匹配，URL 上保留语言代码
    const cleanLocation = {
        ...location,
        pathname: lang.cleanPath,
        search: location.search,
        hash: location.hash,
    }

    return (
        <LanguageProvider value={lang}>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-bg">
                <Navbar />
                <main className="flex-1">
                    <Suspense fallback={<PageFallback />}>
                        <Routes location={cleanLocation}>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/join" element={<Join />} />
                            <Route path="/event" element={<Event />} />
                            <Route path="/events/official/minecraft/4years" element={<FourYearsEvent />} />
                            <Route path="/events/official/minecraft/2027" element={<NewYear2027Event />} />
                            <Route path="/map" element={<Map />} />
                            <Route path="/state" element={<Server />} />
                            <Route path="/stats" element={<Server />} />
                            <Route path="/backend/api/admin" element={<Admin />} />
                            <Route path="/maps/satellite" element={<SatelliteMap />} />
                            <Route path="/maps/railway" element={<RailwayMap />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                </main>
                <Footer />
            </div>
        </LanguageProvider>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    )
}
