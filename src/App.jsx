import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Join from './pages/Join'
import Event from './pages/Event'
import Map from './pages/Map'
import FourYearsEvent from './Events/4years.jsx'

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-extrabold text-primary/30 select-none">404</div>
      <p className="mt-4 text-lg font-medium text-fg">这片区域还没有被建设...</p>
      <p className="mt-1 text-sm text-muted">你访问的页面不存在，也许它还在规划中</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
      >
        返回首页
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-bg">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/join" element={<Join />} />
            <Route path="/event" element={<Event />} />
            <Route path="/events/official/minecraft/4years" element={<FourYearsEvent />} />
            <Route path="/map" element={<Map />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
