import { copyFileSync, mkdirSync } from 'node:fs'

// 跨平台复制 public/cap.min.js 到 dist/（替代 Windows 上没有的 `cp` 命令）
mkdirSync('dist', { recursive: true })
copyFileSync('public/cap.min.js', 'dist/cap.min.js')
console.log('copied public/cap.min.js -> dist/cap.min.js')
