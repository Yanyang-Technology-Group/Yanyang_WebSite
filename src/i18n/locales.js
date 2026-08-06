export const LOCALES = ['zh-cn', 'en-us']
export const DEFAULT_LOCALE = 'zh-cn'

export function normalizeLocale(value) {
  return String(value || '').toLowerCase().replace(/-/g, '_')
}

// 只支持 zh-cn / en-us，其余回退默认（中文），不强制英文
export function canonicalLocale(value) {
  const norm = normalizeLocale(value)
  if (norm === 'zh' || norm === 'zh_cn') return 'zh-cn'
  if (norm.startsWith('en')) return 'en-us'
  if (norm.startsWith('zh')) return 'zh-cn'
  return DEFAULT_LOCALE
}

export function isLocaleCode(value) {
  const norm = normalizeLocale(value)
  return /^[a-z]{2}$/.test(norm) || /^[a-z]{2}_[a-z]{2}$/.test(norm)
}

// 根据浏览器语言识别：zh-* → zh-cn，en-* → en-us，其余回退中文
export function detectLocale() {
  const lang = normalizeLocale(navigator.language || 'zh-CN')
  return isLocaleCode(lang) ? canonicalLocale(lang) : DEFAULT_LOCALE
}
