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
          <span className="hidden sm:inline font-bold text-sm">晏阳城市建设</span>
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

      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`fixed top-0 right-0 bottom-0 w-64 p-6 transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ backgroundColor: '#fff' }}
        >
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
    </nav>
  )
}
