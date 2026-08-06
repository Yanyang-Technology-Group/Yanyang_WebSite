import zhCn from './locales/zh-cn'
import enUs from './locales/en-us'
import { canonicalLocale } from './locales'

const DICTS = {
  'zh-cn': zhCn,
  'en-us': enUs,
}

export function getDict(locale) {
  return DICTS[canonicalLocale(locale)] || zhCn
}

export function buildT(dict) {
  return (key, params) => {
    const value = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict)
    if (value == null) return key
    if (!params) return value
    return String(value).replace(/\{(\w+)\}/g, (match, name) => (params[name] != null ? params[name] : match))
  }
}
