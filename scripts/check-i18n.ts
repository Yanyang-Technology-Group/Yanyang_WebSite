import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zhCn from '../src/i18n/locales/zh-cn.js'
import enUs from '../src/i18n/locales/en-us.js'

type Dict = Record<string, unknown>

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(__dirname, '../src')

// 1) 两个语言文件键必须完全一致
function collectKeys(obj: Dict, prefix = '', out: string[] = []): string[] {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) collectKeys(v as Dict, key, out)
    else out.push(key)
  }
  return out
}

// 2) JSX/TSX 源码中残留中文检查（排除语言文件本身）
const chineseRe = /[\u4e00-\u9fff]/

function walk(dir: string, errors: string[]): void {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, errors)
    } else if (/\.(jsx|tsx|js|ts)$/.test(entry.name)) {
      const rel = path.relative(SRC, full).replace(/\\/g, '/')
      if (rel.startsWith('i18n/locales/')) continue
      const content = fs.readFileSync(full, 'utf8')
      content.split('\n').forEach((line, i) => {
        if (chineseRe.test(line)) {
          errors.push(`[i18n] 未翻译的中文: src/${rel}:${i + 1}: ${line.trim().slice(0, 100)}`)
        }
      })
    }
  }
}

export function checkI18n(): void {
  const errors: string[] = []

  const dicts: Record<string, Dict> = { 'zh-cn': zhCn, 'en-us': enUs }
  const keys = Object.fromEntries(
    Object.entries(dicts).map(([lang, d]) => [lang, collectKeys(d)])
  ) as Record<string, string[]>
  const base = keys['zh-cn']
  for (const lang of Object.keys(dicts)) {
    const missing = base.filter((k) => !keys[lang].includes(k))
    const extra = keys[lang].filter((k) => !base.includes(k))
    if (missing.length || extra.length) {
      errors.push(`[i18n] 语言 ${lang} 与 zh-cn 键不一致`)
      if (missing.length) errors.push(`  缺少: ${missing.join(', ')}`)
      if (extra.length) errors.push(`  多余: ${extra.join(', ')}`)
    }
  }

  walk(path.join(SRC, 'pages'), errors)
  walk(path.join(SRC, 'components'), errors)
  walk(path.join(SRC, 'hooks'), errors)
  walk(path.join(SRC, 'Events'), errors)

  if (errors.length) {
    for (const line of errors) console.error(line)
    console.error('\n[i18n] 存在未翻译的文本，已中止 dev/build。请补齐翻译后再试。')
    throw new Error('[i18n] 翻译检查未通过，已中止 dev/build。')
  }
  console.log('[i18n] 语言检查通过：zh-cn / en-us 键一致，无残留中文。')
}

// 支持直接以脚本方式运行：node --experimental-strip-types scripts/check-i18n.ts
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkI18n()
}
