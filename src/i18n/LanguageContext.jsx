import { createContext, useContext, useMemo } from 'react'
import { getDict, buildT } from './index'

export const LanguageContext = createContext({
  locale: 'zh-cn',
  cleanPath: '/',
  switchLanguage: () => {},
  t: (key) => key,
})

export const useLanguageContext = () => useContext(LanguageContext)

export function LanguageProvider({ value, children }) {
  const t = useMemo(() => buildT(getDict(value.locale)), [value.locale])
  const ctx = useMemo(() => ({ ...value, t }), [value, t])
  return <LanguageContext.Provider value={ctx}>{children}</LanguageContext.Provider>
}
