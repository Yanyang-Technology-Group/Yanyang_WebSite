import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DEFAULT_LOCALE, LOCALES, detectLocale, isLocaleCode, canonicalLocale } from '../i18n/locales'

const STORAGE_KEY = 'yanyang_lang'

function readStoredLocale() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && LOCALES.includes(canonicalLocale(v)) ? canonicalLocale(v) : null
  } catch {
    return null
  }
}

export function useLanguage() {
  const location = useLocation()
  const navigate = useNavigate()

  const segments = location.pathname.split('/').filter(Boolean)
  const first = segments[0]
  const urlLocale = isLocaleCode(first) ? canonicalLocale(first) : null
  const locale = urlLocale || readStoredLocale() || detectLocale()
  const cleanPath = urlLocale
    ? '/' + segments.slice(1).join('/')
    : location.pathname

  // Remember the user's choice
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {}
  }, [locale])

  // Auto-prepend the language code when it is not the default (e.g. /about → /en-us/about)
  useEffect(() => {
    if (!urlLocale && locale !== DEFAULT_LOCALE) {
      const base = location.pathname === '/' ? '' : location.pathname
      const target = `/${locale}${base}`
      navigate(target, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchLanguage = useCallback(
    (next) => {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {}
      const base = cleanPath === '/' ? '' : cleanPath
      const root = document.getElementById('root')
      if (root) root.classList.add('page-theme-fall')
      window.setTimeout(() => {
        if (root) root.classList.remove('page-theme-fall')
      }, 950)
      if (next === DEFAULT_LOCALE) {
        navigate(base || '/')
      } else {
        navigate(`/${next}${base}`)
      }
    },
    [cleanPath, navigate]
  )

  return { locale, cleanPath, switchLanguage, nextLocale: LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length] }
}
