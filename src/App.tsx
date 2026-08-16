import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Join from './pages/Join'
import Event from './pages/Event'
import Map from './pages/Map'
import Verify from './pages/Verify'
import DownloadPage from './pages/Download'
import Admin from './pages/Admin'
import ModpackList from './pages/Downloads/modpack'
import JavaList from './pages/Downloads/java'
import LauncherList from './pages/Downloads/launcher'
import Detail from './pages/Downloads/Detail'
import FourYearsEvent from './Events/4years'
import SatelliteMap from './pages/SatelliteMap'
import RailwayMap from './pages/RailwayMap'
import Server from './pages/Server'
import { LanguageProvider, useLanguageContext } from './i18n/LanguageContext'
import { useLanguage } from './hooks/useLanguage'

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
                    <Routes location={cleanLocation}>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/join" element={<Join />} />
                        <Route path="/event" element={<Event />} />
                        <Route path="/events/official/minecraft/4years" element={<FourYearsEvent />} />
                        <Route path="/map" element={<Map />} />
                        <Route path="/state" element={<Server />} />
                        <Route path="/download" element={<DownloadPage />} />
                        <Route path="/downloads/modpack" element={<ModpackList />} />
                        <Route path="/downloads/java" element={<JavaList />} />
                        <Route path="/downloads/launcher" element={<LauncherList />} />
                        <Route path="/downloads/modpacks/:id" element={<Detail />} />
                        <Route path="/downloads/javas/:id" element={<Detail />} />
                        <Route path="/downloads/launchers/:id" element={<Detail />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route path="/verify/password" element={<Verify />} />
                        <Route path="/verify/password/success" element={<Verify />} />
                        <Route path="/verify/password/error" element={<Verify />} />
                        <Route path="/backend/api/admin" element={<Admin />} />
                        <Route path="/maps/satellite" element={<SatelliteMap />} />
                        <Route path="/maps/railway" element={<RailwayMap />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
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
