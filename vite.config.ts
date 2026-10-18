import { defineConfig, type Plugin, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { checkI18n } from './scripts/check-i18n'

function i18nCheckPlugin(): Plugin {
  return {
    name: 'yanyang-i18n-check',
    buildStart() {
      checkI18n()
    },
  }
}

// 给 index.html 里引用的本地资源注入 SRI（integrity），并去掉打包产物中的许可注释
function sriPlugin(): Plugin {
  return {
    name: 'inject-sri',
    writeBundle(outputOptions: { dir?: string }) {
      const outDir = outputOptions.dir
      if (!outDir) return
      const htmlPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(htmlPath)) return
      let html = fs.readFileSync(htmlPath, 'utf8')
      const addIntegrity = (attr: string) => {
        html = html.replace(new RegExp(`${attr}="(/(?:assets|fonts|theme-init)[^"]*)"`, 'g'), (match: string, url: string) => {
          const file = path.join(outDir, url)
          if (!fs.existsSync(file)) return match
          const hash = createHash('sha384').update(fs.readFileSync(file)).digest('base64')
          return `${attr}="${url}" integrity="sha384-${hash}" crossorigin="anonymous"`
        })
      }
      addIntegrity('src')
      addIntegrity('href')
      fs.writeFileSync(htmlPath, html)
    },
  }
}

// 把 index.html 中内联脚本的 sha256 写进 _headers 的 CSP script-src。
// 站点 CSP 没有放行 'unsafe-inline'，内联的主题初始化脚本必须靠 hash 授权，
// 否则会被浏览器拦截（深色模式首屏闪白）。hash 在构建时自动生成与校验，避免手写失配。
function cspInlineScriptHashPlugin(): Plugin {
  return {
    name: 'csp-inline-script-hash',
    writeBundle(outputOptions: { dir?: string }) {
      const outDir = outputOptions.dir
      if (!outDir) return
      const htmlPath = path.join(outDir, 'index.html')
      const headersPath = path.join(outDir, '_headers')
      if (!fs.existsSync(htmlPath) || !fs.existsSync(headersPath)) return

      const html = fs.readFileSync(htmlPath, 'utf8')
      // 匹配不带 src 属性、且不是 type="module" 外链的内联脚本
      const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
        .map((m) => m[1])
        .filter((code) => code.trim().length > 0)

      const hashes = inlineScripts.map(
        (code) => `'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`
      )

      let headers = fs.readFileSync(headersPath, 'utf8')
      const cspLine = /^\s*Content-Security-Policy:.*$/m.exec(headers)
      if (!cspLine) {
        this.error('[csp] _headers 中找不到 Content-Security-Policy')
        return
      }

      const [oldLine] = cspLine
      // 先移除之前构建写入的 sha256，再按当前产物重新注入
      let newLine = oldLine.replace(/\s*'sha256-[^']+'/g, '')
      if (hashes.length > 0) {
        const scriptSrc = /script-src([^;]*)/.exec(newLine)
        if (!scriptSrc) {
          this.error('[csp] CSP 中找不到 script-src')
          return
        }
        newLine = newLine.replace(
          /script-src([^;]*)/,
          `script-src${scriptSrc[1].trimEnd()} ${hashes.join(' ')}`
        )
      }

      headers = headers.replace(oldLine, newLine)
      fs.writeFileSync(headersPath, headers)
      console.log(`[csp] 已为 ${hashes.length} 段内联脚本注入 script-src hash`)
    },
  }
}

async function getCommitCountFromGitHub(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[GitHub API] 尝试 ${i + 1}/${retries}...`)

      const response = await fetch(
          'https://api.github.com/repos/Yanyang-Technology-Group/Yanyang_WebSite/commits?per_page=1',
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Yanyang-Website'
            }
          }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const linkHeader = response.headers.get('Link')
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/)
        if (match) {
          const count = match[1]
          console.log(`[GitHub API] 成功获取 commit 数量: ${count}`)
          return count
        }
      }

      return '0'
    } catch (error) {
      console.warn(`[GitHub API] 第 ${i + 1} 次失败:`, error instanceof Error ? error.message : String(error))
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  console.warn('[GitHub API] 所有重试失败')
  return null
}

export default defineConfig(async ({ mode, command }): Promise<UserConfig> => {
  const isUserDebug = mode === 'userdebug'

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const buildDate = `${year}.${month}.${day}`

  let commitCount = '0'
  let versionSource = ''

  if (command === 'build') {
    console.log('[版本号] 生产构建，从 GitHub API 获取...')
    const githubCount = await getCommitCountFromGitHub(10)

    if (githubCount !== null) {
      commitCount = githubCount
      versionSource = 'GitHub API'
      console.log(`[版本号] 从 ${versionSource} 获取成功: ${commitCount}`)
    } else if (process.env.VITE_COMMIT_COUNT) {
      commitCount = process.env.VITE_COMMIT_COUNT
      versionSource = '环境变量'
      console.log(`[版本号] GitHub 失败，使用 ${versionSource}: ${commitCount}`)
    } else {
      commitCount = '0'
      versionSource = '默认值'
      console.warn(`[版本号] 所有方式失败，使用 ${versionSource}: ${commitCount}`)
    }
  } else {
    console.log('[版本号] 开发模式，从本地 Git 获取...')
    try {
      const { execSync } = await import('child_process')
      const count = execSync('git rev-list --count HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
      commitCount = count || '0'
      versionSource = '本地 Git'
      console.log(`[版本号] 从 ${versionSource} 获取成功: ${commitCount}`)
    } catch {
      commitCount = '0'
      versionSource = '默认值'
      console.warn(`[版本号] Git 命令失败，使用 ${versionSource}: ${commitCount}`)
    }
  }

  const version = process.env.VERSION || `${buildDate}.${commitCount}`

  const builder = process.env.BUILDER || 'Unknown'
  const buildEnv = process.env.BUILD_ENV || 'production'

  const buildTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  console.log(`\n最终版本: ${version} (来源: ${versionSource})\n`)

  return {
    base: '/',
    plugins: [react(), tailwindcss(), i18nCheckPlugin(), sriPlugin(), cspInlineScriptHashPlugin()],
    esbuild: { legalComments: 'none' },
    define: {
      __USER_DEBUG__: isUserDebug,
      __VERSION__: JSON.stringify(version),
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILDER__: JSON.stringify(builder),
      __BUILD_ENV__: JSON.stringify(buildEnv),
      __BUILD_TIME__: JSON.stringify(buildTime),
      __COMMIT_COUNT__: JSON.stringify(commitCount),
      __VERSION_SOURCE__: JSON.stringify(versionSource),
    },
    build: {
      // 按路由懒加载后，把各页面自己的 CSS（如 tdesign、活动页样式）拆到异步 chunk，
      // 首屏只需下载全局样式，减少阻塞渲染的字节数。
      cssCodeSplit: true,
      sourcemap: false,
      minify: 'esbuild',
      // 体积统计交给 CI/本地脚本，关闭可让构建更快
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'phosphor-icons': ['@phosphor-icons/react'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo: { name?: string }) => {
            const name = assetInfo.name || ''
            const info = name.split('.')
            const ext = info[info.length - 1]
            if (/\.(png|jpe?g|gif|svg|webp|ico|avif)$/.test(name)) {
              return 'assets/[name]-[hash].[ext]'
            }
            if (/\.(css)$/.test(name)) {
              return 'assets/[name]-[hash].[ext]'
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
              return 'assets/[name]-[hash].[ext]'
            }
            return 'assets/[name]-[hash].[ext]'
          },
          // 注意：不要设置 experimentalMinChunkSize，它会把体积小的懒加载 chunk
          // 合并回入口 chunk，抵消路由级代码分割的收益。
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5173,
    },
  }
})
