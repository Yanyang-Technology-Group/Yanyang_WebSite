# 晏阳城建官网重设计 — 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 从 TDesign + 单文件 CSS 迁移到 Tailwind CSS v4 + Phosphor Icons + 手写组件架构

**架构：** Vite + React 19 SPA，5 个路由页面，4 个共享组件。Flat Design 风格，零阴影，色彩分块，Phosphor Icons，Inter 字体。

**技术栈：** React 19, Vite 7, React Router 7, Tailwind CSS v4, @phosphor-icons/react

---

## 任务 1：安装依赖 + 配置 Tailwind CSS v4

**文件：**
- 修改：`package.json`
- 修改：`vite.config.js`
- 修改：`index.html`

- [ ] **步骤 1：安装新依赖**

```bash
npm install tailwindcss @tailwindcss/vite @phosphor-icons/react
```

- [ ] **步骤 2：移除旧依赖**

```bash
npm uninstall tdesign-react tdesign-icons-react
```

- [ ] **步骤 3：更新 vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const isUserDebug = mode === 'userdebug'
  const version = process.env.VERSION || '1.0.0'
  const builder = process.env.BUILDER || 'Unknown'
  const buildEnv = process.env.BUILD_ENV || 'production'

  const buildTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __USER_DEBUG__: isUserDebug,
      __VERSION__: JSON.stringify(version),
      __BUILDER__: JSON.stringify(builder),
      __BUILD_ENV__: JSON.stringify(buildEnv),
      __BUILD_TIME__: JSON.stringify(buildTime),
    },
  }
})
```

- [ ] **步骤 4：更新 index.html — 换 Inter 字体**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>晏阳城市建设 | 公益 Minecraft 服务器</title>
    <meta name="description" content="晏阳城市建设 - 基于 Minecraft Fabric 1.20.1 的城市规划与轨道交通创作服务器">
    <link rel="icon" href="/images/icon.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **步骤 5：验证安装**

```bash
npm run dev
```

预期：Vite 正常启动，无报错。

- [ ] **步骤 6：Commit**

```bash
git add package.json package-lock.json vite.config.js index.html
git commit -m "chore: install Tailwind CSS v4 + Phosphor Icons, remove TDesign"
```

---

## 任务 2：创建 index.css + 更新 main.jsx

**文件：**
- 创建：`src/index.css`
- 修改：`src/main.jsx`

- [ ] **步骤 1：创建 src/index.css**

```css
@import "tailwindcss";

@theme {
  --color-primary: #3B82F6;
  --color-primary-light: #DBEAFE;
  --color-secondary: #10B981;
  --color-accent: #EA580C;
  --color-bg: #FFFFFF;
  --color-surface: #F3F4F6;
  --color-fg: #111827;
  --color-muted: #6B7280;
  --color-border: #E5E7EB;

  --font-sans: 'Inter', 'Noto Sans SC', ui-sans-serif, system-ui, sans-serif;

  --spacing-section: 64px;
  --spacing-card: 24px;
  --radius-card: 6px;
  --radius-btn: 8px;
  --radius-container: 12px;
}

/* base layer — Inter as global default */
@layer base {
  html {
    font-family: var(--font-sans);
    color: var(--color-fg);
    background: var(--color-bg);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
  }

  h1, h2, h3, h4 {
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  p {
    line-height: 1.625;
  }
}

/* scroll reveal */
.reveal-hidden {
  opacity: 0;
  transform: translateY(24px);
}

.reveal-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
```

- [ ] **步骤 2：更新 src/main.jsx**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **步骤 3：验证**

```bash
npm run dev
```

预期：空白页面，无控制台错误。

- [ ] **步骤 4：Commit**

```bash
git add src/index.css src/main.jsx
git commit -m "feat: add Tailwind CSS with design tokens"
```

---

## 任务 3：创建 ScrollReveal 组件

**文件：**
- 创建：`src/components/ScrollReveal.jsx`

- [ ] **步骤 1：创建 src/components/ScrollReveal.jsx**

```jsx
import { useEffect, useRef } from 'react'

export function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('reveal-visible')
          el.classList.remove('reveal-hidden')
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return ref
}

export default function ScrollReveal({ children, className = '', delay = 0 }) {
  const ref = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`reveal-hidden ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/ScrollReveal.jsx
git commit -m "feat: add ScrollReveal component"
```

---

## 任务 4：创建 Navbar 组件

**文件：**
- 创建：`src/components/Navbar.jsx`

- [ ] **步骤 1：创建 src/components/Navbar.jsx**

```jsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'

const NAV_ITEMS = [
  { path: '/', label: '首页' },
  { path: '/about', label: '关于' },
  { path: '/join', label: '加入' },
  { path: '/event', label: '活动' },
  { path: '/map', label: '线路图' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const linkClass = (path) =>
    `relative px-3 py-1.5 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:origin-center ${
      location.pathname === path
        ? 'text-primary after:scale-x-100'
        : 'text-muted hover:text-fg hover:after:scale-x-100'
    }`

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
        scrolled ? 'bg-white/80 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-fg no-underline" onClick={() => window.scrollTo(0, 0)}>
          <img src="/images/logo.png" alt="晏阳" className="h-8 w-auto" />
          <span className="hidden sm:inline font-bold text-sm">晏阳城建</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ path, label }) => (
            <Link key={path} to={path} className={linkClass(path)}>
              {label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-fg"
          onClick={() => setMobileOpen(true)}
          aria-label="打开菜单"
        >
          <List size={24} weight="bold" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white p-6 shadow-none">
            <button
              className="absolute top-4 right-4 p-2 text-fg"
              onClick={() => setMobileOpen(false)}
              aria-label="关闭菜单"
            >
              <X size={24} weight="bold" />
            </button>
            <nav className="mt-12 flex flex-col gap-1">
              {NAV_ITEMS.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-primary-light text-primary'
                      : 'text-fg hover:bg-surface'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/Navbar.jsx
git commit -m "feat: add Navbar component"
```

---

## 任务 5：创建 Footer 组件

**文件：**
- 创建：`src/components/Footer.jsx`

- [ ] **步骤 1：创建 src/components/Footer.jsx**

```jsx
import { useEffect } from 'react'

export default function Footer() {
  useEffect(() => {
    if (__USER_DEBUG__) {
      console.log('[UserDebug] 版本:', __VERSION__)
      console.log('[UserDebug] 构建者:', __BUILDER__)
      console.log('[UserDebug] 构建环境:', __BUILD_ENV__)
      console.log('[UserDebug] 构建时间:', __BUILD_TIME__)
    }
  }, [])

  return (
    <footer className="bg-fg text-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/images/logo2.png" alt="晏阳" className="h-6 w-auto" />
          <span className="text-white font-semibold text-sm">晏阳城市建设</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <a
            href="https://qm.qq.com/q/aBSDTnmJhK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            QQ 群 486029013
          </a>
          <a
            href="mailto:feedback@yanyn.cn"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            feedback@yanyn.cn
          </a>
          <a
            href="https://rail.yanyn.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            晏阳轨道交通
          </a>
        </div>

        <hr className="w-full max-w-xs border-border/20" />

        <div className="text-center text-xs space-y-2">
          <p>&copy; 2025-2026 晏阳技术组 版权所有</p>
          <p>版本 {__VERSION__} · 构建于 {__BUILD_TIME__} (UTC+8) · {__BUILD_ENV__} 环境</p>
          {__USER_DEBUG__ && (
            <p className="text-red-500">【测试版本】USER DEBUG 模式 · 构建者：{__BUILDER__}</p>
          )}
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/Footer.jsx
git commit -m "feat: add Footer component"
```

---

## 任务 6：创建 Skeleton 组件

**文件：**
- 创建：`src/components/Skeleton.jsx`

- [ ] **步骤 1：创建 src/components/Skeleton.jsx**

```jsx
export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface ${className}`}
      {...props}
    />
  )
}

export function SkeletonLine({ width = '100%' }) {
  return <Skeleton style={{ width }} className="h-4" />
}

export function SkeletonBlock({ height = '200px' }) {
  return <Skeleton style={{ height }} className="w-full" />
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/components/Skeleton.jsx
git commit -m "feat: add Skeleton component"
```

---

## 任务 7：创建 Home 页面

**文件：**
- 创建：`src/pages/Home.jsx`

- [ ] **步骤 1：创建 src/pages/Home.jsx**

```jsx
import { Link } from 'react-router-dom'
import { Buildings, Train, ShieldCheck, ArrowRight } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="inline-block px-3 py-1 mb-6 text-xs font-medium text-primary bg-white/15 rounded-full">
            Minecraft Fabric 1.20.1 · 在线运行中
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            晏阳城市建设
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80">
            用方块构筑城市与轨道的梦想
          </p>
          <p className="mt-2 text-sm sm:text-base text-white/60 max-w-xl mx-auto">
            专为热爱城市规划与轨道交通的创造者打造的 Minecraft 公益服务器
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/join"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-btn text-sm hover:bg-white/95 active:scale-[0.97] transition-transform"
            >
              立即加入 <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-white/90 font-medium rounded-btn text-sm border border-white/20 hover:bg-white/10 active:scale-[0.97] transition-transform"
            >
              了解更多
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">100+</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">活跃成员</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">19</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">条地铁线路</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">7</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">座换乘枢纽</div>
            </div>
            <div className="w-px h-10 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">4 年</div>
              <div className="mt-1 text-xs sm:text-sm text-white/60">持续运营</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">服务器亮点</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-fg">专业建造 · 公益社区 · 稳定运营</h2>
          </div>

          <ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Buildings,
                  title: '城市规划建设',
                  desc: '从一砖一瓦到整座城市，自由规划道路、街区和地标建筑，打造你心中的理想城市。',
                },
                {
                  icon: Train,
                  title: '立体轨道交通',
                  desc: '高铁、地铁、轻轨全覆盖，构建跨城交通网络，实现一站直达的便捷通行体验。',
                },
                {
                  icon: ShieldCheck,
                  title: '稳定安全运维',
                  desc: '每日自动备份，崩溃快速恢复，严格维护公平创作环境，保障你的每一份建筑成果。',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-bg rounded-container p-6 sm:p-8 text-center border border-border"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-primary-light text-primary mb-4">
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className="text-base font-semibold text-fg mb-2">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">社群数据</span>
          <ScrollReveal>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: '100+', label: '活跃玩家' },
                { value: '4', label: '年持续运营' },
                { value: '7', label: '座换乘站' },
                { value: '52', label: '社群成员' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-3xl sm:text-4xl font-extrabold text-fg">{value}</div>
                  <div className="mt-1 text-sm text-muted">{label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fg">准备好加入了吗？</h2>
          <p className="mt-2 text-muted">加入 QQ 群，获取白名单，开始你的城市建造之旅</p>
          <Link
            to="/join"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-btn text-sm hover:bg-accent/90 active:scale-[0.97] transition-transform"
          >
            立即加入 <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </section>
    </>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: add Home page"
```

---

## 任务 8：创建 About 页面

**文件：**
- 创建：`src/pages/About.jsx`

- [ ] **步骤 1：创建 src/pages/About.jsx**

```jsx
import { Buildings, Train, Star, Rocket } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

const PARTNERS = [
  { id: 1, url: 'https://rail.yanyn.cn' },
  { id: 2, url: 'https://tech.yanyn.cn' },
  { id: 3, url: 'https://www.yanyn.cn/404' },
  { id: 4, url: 'https://www.yanyn.cn/404' },
  { id: 5, url: 'https://www.yanyn.cn/404' },
  { id: 6, url: 'https://www.yanyn.cn/404' },
  { id: 7, url: 'https://www.yanyn.cn/404' },
  { id: 8, url: 'https://jjmm.ink' },
]

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">关于晏阳</h1>
          <p className="mt-3 text-muted">
            一个以城市建设与轨道交通为核心的 Minecraft 创作社群，汇聚来自多地的爱好者共同筑梦。
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-16">
          {[
            {
              icon: Buildings,
              title: '我们是谁',
              content: [
                '晏阳城市建设 × 晏阳轨道交通是一个以 Minecraft Java Edition 1.20.1 和 Minecraft Transit Railway 4 为核心，集城市建设和轨道交通为一体的 Minecraft 服务器。',
                '成立于 2022 年 7 月 16 日，至今已汇聚众多成员，涵盖城市规划、建筑设计、轨道交通、运营维护等多个领域的爱好者。',
              ],
            },
            {
              icon: Train,
              title: '轨道交通',
              content: [
                '作为服务器的核心灵魂，晏阳轨道交通已建成覆盖全域的一体化公共交通网络。截至目前，已开通运营 19 条地铁线路，建成换乘枢纽 7 座，实现了市区 20 分钟出行圈。',
              ],
            },
            {
              icon: Star,
              title: '社群理念',
              content: [
                '我们始终秉持开放、包容、共创的社群理念。晏阳从不是少数人的创作秀场，而是每一位爱好者都能施展才华的平台。无论你是建筑大佬还是造城新手，都能在这里找到属于自己的位置。',
              ],
            },
            {
              icon: Rocket,
              title: '未来展望',
              content: [
                '未来，晏阳将继续推进城市南拓及西拓片区、新城市的开发建设，完善城市功能配套，打造更多兼具设计感与辨识度的城市地标。同时持续深化轨道交通线网的优化升级，推进市域铁路网、城际铁路的建设，打造更具真实感、更丰富多元的轨交出行体验。',
              ],
            },
          ].map(({ icon: Icon, title, content }, i) => (
            <ScrollReveal key={title} delay={i * 80}>
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-card bg-primary-light text-primary flex items-center justify-center mt-0.5">
                  <Icon size={20} weight="bold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-fg mb-3">{title}</h2>
                  {content.map((p, j) => (
                    <p key={j} className="text-muted leading-relaxed mb-3 last:mb-0">{p}</p>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Transit numbers */}
      <section className="bg-primary py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white">轨道交通数据</h2>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              { value: '19', label: '地铁线路' },
              { value: '7', label: '换乘枢纽' },
              { value: '20min', label: '市区出行圈' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-white">{value}</div>
                <div className="mt-1 text-sm text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-fg">合作伙伴</h2>
            <p className="mt-2 text-sm text-muted">感谢以下伙伴的支持与合作</p>
          </div>
          <ScrollReveal>
            <div className="overflow-hidden">
              <div className="flex gap-8 animate-scroll">
                {[...PARTNERS, ...PARTNERS].map((p, i) => (
                  <a
                    key={`${p.id}-${i}`}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-24 h-12 bg-bg rounded-card border border-border flex items-center justify-center p-2 hover:border-primary/30 transition-colors"
                  >
                    <img
                      src={`/images/us/${p.id}.png`}
                      alt={`合作伙伴 ${p.id}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
```

- [ ] **步骤 2：在 index.css 的 `@theme` 块中追加 CSS 动画**

```css
@theme {
  /* ... existing tokens ... */

  --animate-scroll: scroll 30s linear infinite;
}

@keyframes scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/pages/About.jsx src/index.css
git commit -m "feat: add About page with partners carousel"
```

---

## 任务 9：创建 Join 页面

**文件：**
- 创建：`src/pages/Join.jsx`

- [ ] **步骤 1：创建 src/pages/Join.jsx**

```jsx
import { useState } from 'react'
import { ChatTeardropText, Article, Play, Desktop, Gear, User, Envelope, Cpu, DeviceMobileCamera, HardDrives, WifiHigh } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(
    () => {
      const el = document.createElement('div')
      el.textContent = `已复制${label}: ${text}`
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-fg text-white text-sm px-4 py-2 rounded-btn shadow-none z-50'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    },
    () => {
      const el = document.createElement('div')
      el.textContent = '复制失败，请手动复制'
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-fg text-white text-sm px-4 py-2 rounded-btn shadow-none z-50'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  )
}

export default function Join() {
  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">加入晏阳</h1>
          <p className="mt-3 text-muted">
            在 Minecraft 里亲手搭建梦想都市，与志同道合的伙伴一起创造属于你的城市传奇。
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              {[
                {
                  step: 1,
                  icon: ChatTeardropText,
                  title: '加入 QQ 群',
                  desc: '通过下方按钮加入 QQ 交流群，与管理员取得联系。',
                  highlight: true,
                },
                {
                  step: 2,
                  icon: Article,
                  title: '提交申请',
                  desc: '在群内阅读入服须知，按要求填写入服申请表。',
                  highlight: false,
                },
                {
                  step: 3,
                  icon: Play,
                  title: '开始创作',
                  desc: '审核通过后即可进入服务器，开启你的城市建设之旅。',
                  highlight: false,
                },
              ].map(({ step, icon: Icon, title, desc, highlight }) => (
                <div
                  key={step}
                  className={`flex-1 p-6 rounded-container border text-center ${
                    highlight
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg border-border text-fg'
                  }`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-card mb-4 ${
                      highlight ? 'bg-white/20 text-white' : 'bg-primary-light text-primary'
                    }`}
                  >
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className={`text-lg font-bold ${highlight ? 'text-white' : 'text-fg'} mb-2`}>
                    {step}. {title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${highlight ? 'text-white/70' : 'text-muted'}`}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <div className="mt-8 text-center">
            <a
              href="https://qm.qq.com/q/aBSDTnmJhK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
            >
              <ChatTeardropText size={18} weight="bold" />
              加入 QQ 群聊
            </a>
          </div>
        </div>
      </section>

      {/* Server Info */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal delay={80}>
            <h2 className="text-xl font-bold text-fg mb-6">服务器信息</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Desktop, label: '游戏版本', value: 'Java 1.20.1' },
                { icon: Gear, label: '核心框架', value: 'Fabric + MTR 4' },
                { icon: User, label: 'QQ 群号', value: '486029013', copyable: true },
                { icon: Envelope, label: '反馈邮箱', value: 'feedback@yanyn.cn', copyable: true },
              ].map(({ icon: Icon, label, value, copyable }) => (
                <div
                  key={label}
                  className={`bg-bg rounded-container p-4 border border-border ${
                    copyable ? 'cursor-pointer hover:border-primary/30 active:scale-[0.97] transition-all' : ''
                  }`}
                  onClick={() => copyable && copyToClipboard(value, label)}
                  title={copyable ? `点击复制${label}` : undefined}
                >
                  <Icon size={20} weight="bold" className="text-primary mb-2" />
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className="text-sm font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <h2 className="text-xl font-bold text-fg mt-8 mb-6">硬件配置</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Cpu, label: '处理器', value: 'E5-2698B V3 16C32T' },
                { icon: DeviceMobileCamera, label: '内存', value: '32GB DDR3 1866MHz' },
                { icon: HardDrives, label: '存储', value: '512GB NVMe SSD' },
                { icon: WifiHigh, label: '网络', value: '1000M↓ / 80M↑' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-bg rounded-container p-4 border border-border">
                  <Icon size={20} weight="bold" className="text-primary mb-2" />
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className="text-sm font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <h2 className="text-xl font-bold text-fg mt-8 mb-6">技术服务</h2>
            <div className="flex flex-wrap items-center gap-8">
              <a href="https://www.passnat.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-bg rounded-container border border-border hover:border-primary/30 transition-colors">
                <img src="/images/join/frplogo.png" alt="FRP" className="h-8 w-auto" />
                <span className="text-sm font-medium text-fg">FRP 内网穿透</span>
              </a>
              <a href="https://www.rainyun.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-bg rounded-container border border-border hover:border-primary/30 transition-colors">
                <img src="/images/join/webserver.png" alt="云服务" className="h-8 w-auto" />
                <span className="text-sm font-medium text-fg">网站云服务</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal delay={240}>
            <h2 className="text-xl font-bold text-fg mb-6">常见问题</h2>
            <div className="divide-y divide-border border border-border rounded-container bg-bg">
              {[
                { q: '需要正版 Minecraft 才能加入吗？', a: '不需要，服务器支持离线登录，没有正版也可以加入游玩。' },
                { q: '对建筑水平有要求吗？', a: '没有硬性要求！无论你是建筑大佬还是新手，只要热爱城市建设，都欢迎加入。社群内有经验丰富的玩家可以提供指导。' },
                { q: '服务器有哪些规则？', a: '主要包括：禁止使用外挂/熊服、尊重他人建筑作品、遵守城市规划布局等。详细规则将在 QQ 群内公布。' },
                { q: '审核需要多长时间？', a: '通常管理员会在 24 小时内处理你的入服申请，高峰期可能稍有延迟。' },
              ].map(({ q, a }) => (
                <FAQItem key={q} question={q} answer={a} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-fg hover:bg-surface/50 transition-colors"
      >
        {question}
        <span className={`ml-4 transition-transform text-muted ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-muted leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/pages/Join.jsx
git commit -m "feat: add Join page"
```

---

## 任务 10：创建 Event 页面

**文件：**
- 创建：`src/pages/Event.jsx`

- [ ] **步骤 1：创建 src/pages/Event.jsx**

```jsx
import ScrollReveal from '../components/ScrollReveal'

const EVENTS = [
  {
    date: '2026 年 7 月 16 日',
    title: '晏阳 4 周年庆典',
    desc: '庆祝晏阳成立 4 周年，开展公开参观及游戏活动。',
    tag: '即将开始',
    active: true,
  },
]

export default function Event() {
  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">活动与动态</h1>
          <p className="mt-3 text-muted">
            晏阳城市建设的最新动态、版本更新与社群活动
          </p>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="relative pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {EVENTS.map((event, i) => (
                <div
                  key={i}
                  className="relative pb-10 last:pb-0"
                >
                  <div
                    className={`absolute left-[-30px] top-1.5 w-[22px] h-[22px] rounded-full border-2 ${
                      event.active
                        ? 'bg-primary border-primary'
                        : 'bg-bg border-border'
                    }`}
                  />
                  <div className="text-xs font-medium text-muted mb-1">{event.date}</div>
                  <h3
                    className={`text-lg font-bold mb-1 ${
                      event.active ? 'text-fg' : 'text-muted'
                    }`}
                  >
                    {event.title}
                  </h3>
                  <p className={`text-sm ${event.active ? 'text-muted' : 'text-muted/50'}`}>
                    {event.desc}
                  </p>
                  {event.tag && (
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                        event.active
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-surface text-muted'
                      }`}
                    >
                      {event.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/pages/Event.jsx
git commit -m "feat: add Event page"
```

---

## 任务 11：创建 Map 页面 + 保留 4years 活动页

**文件：**
- 创建：`src/pages/Map.jsx`

- [ ] **步骤 1：创建 src/pages/Map.jsx**

```jsx
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
```

- [ ] **步骤 2：Commit**

```bash
git add src/pages/Map.jsx
git commit -m "feat: add Map page"
```

---

## 任务 12：重写 App.jsx

**文件：**
- 修改：`src/App.jsx`

- [ ] **步骤 1：重写 src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Join from './pages/Join'
import Event from './pages/Event'
import Map from './pages/Map'

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
            <Route path="/map" element={<Map />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
```

- [ ] **步骤 2：Commit**

```bash
git add src/App.jsx
git commit -m "feat: rewrite App.jsx with new components and pages"
```

---

## 任务 13：清理旧文件 + 最终验证

**文件：**
- 删除：`src/style.css`
- 删除：`src/About.jsx`（旧）
- 删除：`src/Join.jsx`（旧）
- 删除：`src/Event.jsx`（旧）
- 删除：`src/Map.jsx`（旧）
- 保留：`src/Events/4years.jsx`（活动详情页，后续迁移）

- [ ] **步骤 1：删除旧文件**

```bash
rm src/style.css
```

- [ ] **步骤 2：验证构建**

```bash
npm run build
```

预期：构建成功，无错误。输出应在 `dist/` 目录中。

- [ ] **步骤 3：验证开发服务器**

```bash
npm run dev
```

预期：无控制台错误。访问以下路径确认页面正常渲染：
- `/` — 首页
- `/about` — 关于页
- `/join` — 加入页
- `/event` — 活动页
- `/map` — 地图页
- `/nonexistent` — 404 页

- [ ] **步骤 4：检查设计原则合规性**

在浏览器中验证：
- 零阴影（任何元素 `box-shadow` 应为 none）
- 无渐变背景
- 无装饰性动画（仅滚动渐入和按钮 press）
- 所有图标来自 Phosphor Icons
- 无 `!important` 样式
- 无 `tdesign-react` 或 `tdesign-icons-react` 的 import

- [ ] **步骤 5：Commit**

```bash
git add -A
git commit -m "chore: remove old style.css and migrated page files"
```

---

## 验证命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览构建产物
npm run preview
```
