import { useEffect, useState } from 'react'

const THEME_KEY = 'yanyang_theme'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {}
  return getSystemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    const root = document.getElementById('root')
    if (root) {
      root.classList.add('page-theme-fall')
    }
    // 页面坠到底部时切换主题，随后弹回
    window.setTimeout(() => {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }, 200)
    window.setTimeout(() => {
      if (root) root.classList.remove('page-theme-fall')
    }, 950)
  }

  return { theme, toggleTheme }
}
