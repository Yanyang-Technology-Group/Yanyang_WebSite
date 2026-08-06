import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zhCn from '../src/i18n/locales/zh-cn.js'
import enUs from '../src/i18n/locales/en-us.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(__dirname, '../src')
let ok = true

// 1) 三个语言文件键必须完全一致
function collectKeys(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) collectKeys(v, key, out)
    else out.push(key)
  }
  return out
}

const dicts = { 'zh-cn': zhCn, 'en-us': enUs }
const keys = Object.fromEntries(Object.entries(dicts).map(([lang, d]) => [lang, collectKeys(d)]))
const base = keys['zh-cn']
for (const lang of Object.keys(dicts)) {
  const missing = base.filter((k) => !keys[lang].includes(k))
  const extra = keys[lang].filter((k) => !base.includes(k))
  if (missing.length || extra.length) {
    ok = false
    console.error(`[i18n] 语言 ${lang} 与 zh-cn 键不一致`)
    if (missing.length) console.error(`  缺少: ${missing.join(', ')}`)
    if (extra.length) console.error(`  多余: ${extra.join(', ')}`)
  }
}

// 2) JSX/JS 源码中残留中文检查（排除语言文件本身）
const chineseRe = /[\u4e00-\u9fff]/
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(jsx|js)$/.test(entry.name)) {
      const rel = path.relative(SRC, full).replace(/\\/g, '/')
      if (rel.startsWith('i18n/locales/')) continue
      const content = fs.readFileSync(full, 'utf8')
      content.split('\n').forEach((line, i) => {
        if (chineseRe.test(line)) {
          ok = false
          console.error(`[i18n] 未翻译的中文: src/${rel}:${i + 1}: ${line.trim().slice(0, 100)}`)
        }
      })
    }
  }
}
walk(path.join(SRC, 'pages'))
walk(path.join(SRC, 'components'))
walk(path.join(SRC, 'hooks'))
walk(path.join(SRC, 'Events'))

if (!ok) {
  console.error('\n[i18n] 存在未翻译的文本，已中止 dev/build。请补齐翻译后再试。')
  process.exit(1)
}
console.log('[i18n] 语言检查通过：zh-cn / en-us 键一致，无残留中文。')
