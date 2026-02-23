import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import About from './About.jsx'
import Join from './Join.jsx'
import Activity from './Activity.jsx'

function NavLink({ to, children, onClick, external }) {
  const location = useLocation()
  const isActive = location.pathname === to

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="external" onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <Link to={to} className={isActive ? 'active' : ''} onClick={onClick}>
      {children}
    </Link>
  )
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const close = () => setIsOpen(false)

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" onClick={close}>
          <img src="/logo.png" alt="晏阳城市建设" className="logo" />
        </Link>
        <button
          className={`hamburger ${isOpen ? 'open' : ''}`}
          aria-label="切换导航菜单"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li><NavLink to="/" onClick={close}>首页</NavLink></li>
          <li><NavLink to="/activity" onClick={close}>活动</NavLink></li>
          <li><NavLink to="/join" onClick={close}>加入</NavLink></li>
          <li><NavLink to="/about" onClick={close}>关于</NavLink></li>
          <li><NavLink to="https://rail.yanyn.cn/" onClick={close} external>轨交</NavLink></li>
        </ul>
      </div>
    </nav>
  )
}

function PageTransition({ children }) {
  const location = useLocation()
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('page-transition-active')
    el.classList.add('page-transition-enter')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove('page-transition-enter')
        el.classList.add('page-transition-active')
      })
    })
  }, [location.pathname])

  return <div ref={ref} className="page-transition-enter">{children}</div>
}

function HeroParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.4 + 0.1,
  }))

  return (
    <div className="hero-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="hero-particle"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function Home() {
  return (
    <>
      <section className="hero">
        <HeroParticles />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Minecraft Fabric 1.20.1
          </div>
          <h1>
            用方块构筑
            <br />
            <span className="gradient-text">城市与轨道的梦想</span>
          </h1>
          <p className="hero-desc">
            晏阳城市建设 —— 专为热爱城市规划与轨道交通的创造者打造的创作服务器。
            零熊服、无外挂，纯粹的创作环境，让每一份心血都被珍视。
          </p>
          <div className="hero-buttons">
            <Link to="/join" className="btn btn-primary">立即加入</Link>
            <Link to="/about" className="btn btn-outline">了解更多</Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🏙️</div>
            <h3>城市规划建设</h3>
            <p>从一砖一瓦到整座城市，自由规划道路、街区和地标建筑，打造你心中的理想城市。</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚇</div>
            <h3>立体轨道交通</h3>
            <p>高铁、地铁、轻轨全覆盖，构建跨城交通网络，实现一站直达的便捷通行体验。</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>稳定安全运维</h3>
            <p>每日自动备份，崩溃快速恢复，严格维护公平创作环境，保障你的每一份建筑成果。</p>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">52+</div>
          <div className="stat-label">活跃成员</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">19</div>
          <div className="stat-label">地铁线路</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">7</div>
          <div className="stat-label">换乘枢纽</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">4年</div>
          <div className="stat-label">持续运营</div>
        </div>
      </div>
    </>
  )
}

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <p>抱歉，你访问的页面不存在。</p>
      <Link to="/" className="btn btn-primary">返回首页</Link>
    </div>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="晏阳" />
          <span>晏阳城市建设</span>
        </div>
        <div className="footer-links">
          <a href="https://qm.qq.com/q/aBSDTnmJhK" target="_blank" rel="noopener noreferrer">QQ群 486029013</a>
          <a href="mailto:feedback@yanyn.cn">feedback@yanyn.cn</a>
          <a href="https://rail.yanyn.cn/" target="_blank" rel="noopener noreferrer">轨道交通系统</a>
        </div>
        <div className="footer-copy">
          &copy; 2025-2026 晏阳技术组 版权所有
        </div>
      </div>
    </footer>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/join" element={<Join />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      <Footer />
    </BrowserRouter>
  )
}

export default App
