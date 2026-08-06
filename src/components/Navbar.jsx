import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, X, Sun, Moon } from '@phosphor-icons/react'
import { useTheme } from '../hooks/useTheme'
import { useLanguageContext } from '../i18n/LanguageContext'

const NAV_ITEMS = [
  { path: '/', key: 'nav.home' },
  { path: '/about', key: 'nav.about' },
  { path: '/join', key: 'nav.join' },
  { path: '/event', key: 'nav.event' },
  { path: '/map', key: 'nav.map' },
  { path: '/download', key: 'nav.download' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { cleanPath, t } = useLanguageContext()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const linkClass = (path) =>
    `relative px-3 py-1.5 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary after:scale-x-0 after:transition-transform after:origin-center ${
      cleanPath === path
        ? 'text-primary after:scale-x-100'
        : 'text-muted hover:text-fg hover:after:scale-x-100'
    }`

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-fg no-underline" onClick={() => window.scrollTo(0, 0)}>
          <img src="/images/icon.png" alt="Yanyang" className="h-8 w-auto" />
          <span className="hidden sm:inline font-bold text-sm">{t('nav.brand')}</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 ml-auto mr-2">
          {NAV_ITEMS.map(({ path, key }) => (
            <Link key={path} to={path} className={linkClass(path)}>
              {t(key)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            className="md:hidden p-2 text-fg"
            onClick={() => setMobileOpen(true)}
            aria-label={t('nav.openMenu')}
          >
            <List size={24} weight="bold" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-btn bg-transparent border-transparent text-muted hover:text-fg hover:bg-transparent transition-colors"
            aria-label={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
            title={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
          >
            <span key={theme} className="theme-toggle-icon">
              {theme === 'dark' ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <div
      className={`fixed inset-0 z-[60] md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
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
        className={`fixed top-0 right-0 bottom-0 w-64 p-6 transition-transform duration-300 ease-out bg-bg border-l border-border ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
          <button
            className="absolute top-4 right-4 p-2 text-fg"
            onClick={() => setMobileOpen(false)}
            aria-label={t('nav.closeMenu')}
          >
            <X size={24} weight="bold" />
          </button>
          <nav className="mt-12 flex flex-col gap-1">
            {NAV_ITEMS.map(({ path, key }) => (
              <Link
                key={path}
                to={path}
                className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  cleanPath === path
                    ? 'bg-primary-light text-primary'
                    : 'text-fg hover:bg-surface'
                }`}
              >
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
