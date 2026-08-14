import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { getDict, buildT, type TFunction } from './index'
import type { Locale } from './locales'

export interface LanguageContextValue {
  locale: Locale
  cleanPath: string
  switchLanguage: (next: Locale) => void
  nextLocale: Locale
  t: TFunction
}

export const LanguageContext = createContext<LanguageContextValue>({
  locale: 'zh-cn',
  cleanPath: '/',
  switchLanguage: () => {},
  nextLocale: 'en-us',
  t: (key) => key,
})

export const useLanguageContext = () => useContext(LanguageContext)

export function LanguageProvider({ value, children }: { value: Omit<LanguageContextValue, 't'>; children: ReactNode }) {
  const t = useMemo(() => buildT(getDict(value.locale)), [value.locale])
  const ctx = useMemo<LanguageContextValue>(() => ({ ...value, t }), [value, t])
  return <LanguageContext.Provider value={ctx}>{children}</LanguageContext.Provider>
}
