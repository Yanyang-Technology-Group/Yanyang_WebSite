import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import About from './About.jsx'
import Join from './Join.jsx'

const colors = [
  { r: 255, g: 255, b: 255 },
  { r: 245, g: 245, b: 255 },
  { r: 230, g: 248, b: 255 },
  { r: 255, g: 250, b: 240 },
]

function interpolateColor(color1, color2, factor) {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * factor),
    g: Math.round(color1.g + (color2.g - color1.g) * factor),
    b: Math.round(color1.b + (color2.b - color1.b) * factor),
  }
}

function rgbToString(rgb) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

function useBackgroundColor() {
  const [backgroundColor, setBackgroundColor] = useState('rgb(255, 255, 255)')

  useEffect(() => {
    let startTime = null
    let animationId
    const duration = 10000

    function animate(currentTime) {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const cycleIndex = Math.floor(elapsed / duration)
      const progress = (elapsed % duration) / duration

      const currentColor = colors[cycleIndex % colors.length]
      const nextColor = colors[(cycleIndex + 1) % colors.length]
      const interpolatedColor = interpolateColor(currentColor, nextColor, progress)

      setBackgroundColor(rgbToString(interpolatedColor))

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return backgroundColor
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="nav-container">
        <img src="/logo.png" alt="晏阳城市建设 Logo" className="logo" />
        <button className="hamburger" aria-label="切换导航菜单" onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setIsOpen(false)}>首页</Link></li>
          <li><a href="/activity" onClick={() => setIsOpen(false)}>活动</a></li>
          <li><Link to="/join" onClick={() => setIsOpen(false)}>加入</Link></li>
          <li><Link to="/about" onClick={() => setIsOpen(false)}>关于</Link></li>
          <li><a href="https://rail.yanyn.cn/" onClick={() => setIsOpen(false)}>轨交</a></li>
        </ul>
      </div>
    </nav>
  )
}

function NotFound() {
  return (
    <main className="main-content not-found">
      <h1>404</h1>
      <p>抱歉，你访问的页面不存在。</p>
      <div className="not-found-button-container">
        <Link to="/" className="not-found-button">返回首页</Link>
      </div>
    </main>
  )
}

function Home() {
  return (
    <main className="main-content">
      <h1>欢迎来到晏阳城市建设</h1>
      <p>
        &emsp;&emsp;「晏阳城市建设」服务器 —— 基于 Minecraft Fabric 1.20.1 版本，专为热爱城市规划与轨道交通的创造者打造的像素乌托邦！
      </p>
      <p>
        &emsp;&emsp;零熊服、无外挂，严格维护公平创作环境，让每一份心血都能被珍视；轨道交通体系：铺设跨城高铁、地下地铁、观光轻轨，构建覆盖全城的立体交通网，实现 "一站直达" 的便捷通行，解锁 "轨道串联生活" 的经营乐趣。
      </p>
      <p>
        &emsp;&emsp;我们的承诺: 稳定运维：每日自动备份，服务器崩溃 10 分钟内快速恢复，保障建筑安全；持续更新：倾听玩家建议，迭代轨道工具、城市设施等玩法内容，让晏阳始终充满新鲜感；平等尊重：无论你是建筑大佬还是造城新手，在这里都能找到属于自己的位置，用方块书写城市传奇。
      </p>
    </main>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; 2025-2026 晏阳技术组 版权所有。</p>
      <p>联系方式 <a href="https://qm.qq.com/q/aBSDTnmJhK" target="_blank" rel="noopener noreferrer">QQ群486029013</a> | 邮箱feedback@yanyn.cn</p>
    </footer>
  )
}

function App() {
  const backgroundColor = useBackgroundColor()

  return (
    <BrowserRouter>
      <div style={{ backgroundColor, minHeight: '100vh', transition: 'background-color 0.5s ease' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/join" element={<Join />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
