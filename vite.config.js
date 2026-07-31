import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

async function getCommitCountFromGitHub() {
  try {
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
      return '0'
    }

    const linkHeader = response.headers.get('Link')
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/)
      if (match) {
        return match[1]
      }
    }

    return '0'
  } catch {
    return '0'
  }
}

export default defineConfig(async ({ mode, command }) => {
  const isUserDebug = mode === 'userdebug'

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const buildDate = `${year}.${month}.${day}`

  let commitCount = '0'

  if (command === 'build') {
    commitCount = await getCommitCountFromGitHub()
  } else {
    try {
      const { execSync } = await import('child_process')
      const count = execSync('git rev-list --count HEAD', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim()
      commitCount = count || '0'
    } catch {
      commitCount = '0'
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

  console.log(`\nVersion: ${version}\n`)

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __USER_DEBUG__: isUserDebug,
      __VERSION__: JSON.stringify(version),
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILDER__: JSON.stringify(builder),
      __BUILD_ENV__: JSON.stringify(buildEnv),
      __BUILD_TIME__: JSON.stringify(buildTime),
      __COMMIT_COUNT__: JSON.stringify(commitCount),
    },
  }
})