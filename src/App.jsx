import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Space,
  Divider,
  Statistic,
  Menu,
  Drawer,
  Link as TLink,
  BackTop,
  Alert,
  Tag,
} from 'tdesign-react'
import {
  CityIcon,
  SubwayLineIcon,
  SecuredIcon,
  HomeIcon,
  CalendarIcon,
  UserAddIcon,
  InfoCircleIcon,
  LinkIcon,
  MenuFoldIcon,
  BacktopIcon,
  ArrowRightIcon,
} from 'tdesign-icons-react'
import About from './About.jsx'
import Join from './Join.jsx'
import Activity from './Activity.jsx'

const { HeadMenu, MenuItem } = Menu

/* ========== 滚动入场动画 Hook ========== */
function useScrollReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.unobserve(el)
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}

function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`reveal-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ========== 导航栏 ========== */
function Navbar() {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { path: '/', label: '首页', icon: <HomeIcon /> },
    { path: '/activity', label: '活动', icon: <CalendarIcon /> },
    { path: '/join', label: '加入', icon: <UserAddIcon /> },
    { path: '/about', label: '关于', icon: <InfoCircleIcon /> },
  ]

  const handleNavClick = (path) => {
    navigate(path)
    setDrawerVisible(false)
    window.scrollTo(0, 0)
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={() => window.scrollTo(0, 0)}>
          <img src="/logo.png" alt="晏阳城市建设" className="logo" />
        </Link>

        <div className="nav-desktop">
          <HeadMenu
            value={location.pathname}
            onChange={(val) => handleNavClick(val)}
            style={{ borderBottom: 'none', background: 'transparent' }}
          >
            {navItems.map(item => (
              <MenuItem key={item.path} value={item.path}>
                {item.label}
              </MenuItem>
            ))}
            <MenuItem value="__external_rail">
              <a
                href="https://rail.yanyn.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-external-link"
                onClick={(e) => e.stopPropagation()}
              >
                轨交 <LinkIcon size="14px" />
              </a>
            </MenuItem>
          </HeadMenu>
        </div>

        <button
          className="hamburger-btn"
          aria-label="切换导航菜单"
          onClick={() => setDrawerVisible(true)}
        >
          <MenuFoldIcon size="24px" />
        </button>

        <Drawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          header="导航菜单"
          placement="right"
          size="280px"
        >
          <div className="drawer-nav">
            {navItems.map(item => (
              <div
                key={item.path}
                className={`drawer-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
            <Divider />
            <a
              href="https://rail.yanyn.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="drawer-nav-item external"
            >
              <LinkIcon />
              <span>轨道交通系统</span>
              <LinkIcon size="12px" style={{ marginLeft: 'auto' }} />
            </a>
          </div>
        </Drawer>
      </div>
    </nav>
  )
}

/* ========== 页面过渡 ========== */
function PageTransition({ children }) {
  const location = useLocation()
  const ref = useRef(null)
  const isFirst = useRef(true)

  useEffect(() => {
    // 首次渲染直接显示，不做动画
    if (isFirst.current) {
      isFirst.current = false
      const el = ref.current
      if (el) el.classList.add('page-transition-active')
      return
    }

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

  return <div ref={ref}>{children}</div>
}

/* ========== 首页 ========== */
function Home() {
  const [alertVisible, setAlertVisible] = useState(true)

  return (
    <>
      {/* 公告栏 */}
      {alertVisible && (
        <div className="announcement-bar">
          <Alert
            theme="info"
            message="西部新城计划已启动 —— 西部新城建设火热进行中，欢迎加入共建！"
            close
            onClose={() => setAlertVisible(false)}
          />
        </div>
      )}

      {/* 全新首页顶部：品牌展示区 */}
      <section className="brand-hero">
        <div className="brand-hero-bg"></div>
        <div className="brand-hero-content">
          <Tag theme="success" variant="light" shape="round" size="medium" className="brand-tag">
            Minecraft Fabric 1.20.1 · 在线运行中
          </Tag>
          <h1 className="brand-title">
            <span className="brand-title-main">晏阳城市建设</span>
            <span className="brand-title-sub">用方块构筑城市与轨道的梦想</span>
          </h1>
          <p className="brand-desc">
            专为热爱城市规划与轨道交通的创造者打造的 Minecraft 创作服务器。
            <br className="hide-mobile" />
            零熊服、无外挂，纯粹的创作环境，让每一份心血都被珍视。
          </p>
          <Space size="medium" className="brand-actions">
            <Link to="/join">
              <Button theme="primary" size="large" shape="round" icon={<UserAddIcon />}>
                立即加入
              </Button>
            </Link>
            <Link to="/about">
              <Button theme="primary" size="large" shape="round" icon={<ArrowRightIcon />}>
                了解更多
              </Button>
            </Link>
          </Space>

          {/* 内嵌统计数据 */}
          <div className="brand-stats">
            <div className="brand-stat">
              <span className="brand-stat-num">52+</span>
              <span className="brand-stat-label">活跃成员</span>
            </div>
            <div className="brand-stat-divider"></div>
            <div className="brand-stat">
              <span className="brand-stat-num">19</span>
              <span className="brand-stat-label">地铁线路</span>
            </div>
            <div className="brand-stat-divider"></div>
            <div className="brand-stat">
              <span className="brand-stat-num">7</span>
              <span className="brand-stat-label">换乘枢纽</span>
            </div>
            <div className="brand-stat-divider"></div>
            <div className="brand-stat">
              <span className="brand-stat-num">4年</span>
              <span className="brand-stat-label">持续运营</span>
            </div>
          </div>
        </div>
      </section>

      {/* 特性卡片 */}
      <section className="features-section">
        <RevealSection className="features-grid">
          <Card className="feature-card" hoverShadow>
            <div className="feature-icon-wrap">
              <CityIcon size="28px" />
            </div>
            <h3>城市规划建设</h3>
            <p>从一砖一瓦到整座城市，自由规划道路、街区和地标建筑，打造你心中的理想城市。</p>
          </Card>
          <Card className="feature-card" hoverShadow>
            <div className="feature-icon-wrap">
              <SubwayLineIcon size="28px" />
            </div>
            <h3>立体轨道交通</h3>
            <p>高铁、地铁、轻轨全覆盖，构建跨城交通网络，实现一站直达的便捷通行体验。</p>
          </Card>
          <Card className="feature-card" hoverShadow>
            <div className="feature-icon-wrap">
              <SecuredIcon size="28px" />
            </div>
            <h3>稳定安全运维</h3>
            <p>每日自动备份，崩溃快速恢复，严格维护公平创作环境，保障你的每一份建筑成果。</p>
          </Card>
        </RevealSection>
      </section>
    </>
  )
}

/* ========== 404 页面 ========== */
function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-illustration">
        <div className="not-found-block block-1"></div>
        <div className="not-found-block block-2"></div>
        <div className="not-found-block block-3"></div>
      </div>
      <div className="not-found-code">404</div>
      <p className="not-found-text">这片区域还没有被建设...</p>
      <p className="not-found-hint">你访问的页面不存在，也许它还在规划中</p>
      <Link to="/">
        <Button theme="primary" size="large" shape="round" icon={<HomeIcon />}>
          返回首页
        </Button>
      </Link>
    </div>
  )
}

/* ========== 页脚 ========== */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="晏阳" />
          <span>晏阳城市建设</span>
        </div>
        <Space size="large" className="footer-links">
          <TLink
            href="https://qm.qq.com/q/aBSDTnmJhK"
            target="_blank"
            theme="primary"
            underline
          >
            QQ群 486029013
          </TLink>
          <TLink href="mailto:feedback@yanyn.cn" theme="primary" underline>
            feedback@yanyn.cn
          </TLink>
          <TLink
            href="https://rail.yanyn.cn/"
            target="_blank"
            theme="primary"
            underline
          >
            轨道交通系统
          </TLink>
        </Space>
        <Divider className="footer-divider" />
        <div className="footer-copy">
          &copy; 2025-2026 晏阳技术组 版权所有
        </div>
      </div>
    </footer>
  )
}

/* ========== 主应用 ========== */
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
      <BackTop
        visibleHeight={300}
        shape="round"
        theme="primary"
        offset={['24px', '80px']}
      />
    </BrowserRouter>
  )
}

export { RevealSection }
export default App
