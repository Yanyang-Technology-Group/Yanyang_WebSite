import zhCn from './locales/zh-cn'
import enUs from './locales/en-us'
import { canonicalLocale, type Locale } from './locales'

export type TranslationParams = Record<string, string | number>
export type TFunction = (key: string, params?: TranslationParams) => string
export type TranslationDict = Record<string, unknown>

const DICTS: Record<Locale, TranslationDict> = {
  'zh-cn': zhCn,
  'en-us': enUs,
}

export function getDict(locale: string): TranslationDict {
  return DICTS[canonicalLocale(locale)] || zhCn
}

export function buildT(dict: TranslationDict): TFunction {
  return (key, params) => {
    const value = key.split('.').reduce<unknown>(
      (o, k) => (o == null ? undefined : (o as TranslationDict)[k]),
      dict
    )
    if (value == null) return key
    if (!params) return String(value)
    return String(value).replace(/\{(\w+)\}/g, (match, name: string) =>
      params[name] != null ? String(params[name]) : match
    )
  }
}
