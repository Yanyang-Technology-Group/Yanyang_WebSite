import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'  // 添加这行

// 获取提交次数的函数
function getCommitCount() {
  try {
    // 检查是否在 Git 仓库中
    execSync('git rev-parse --git-dir', { stdio: 'ignore' })

    // 获取提交总数
    const count = execSync('git rev-list --count HEAD', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim()

    return count || '0'
  } catch (error) {
    console.warn('⚠️ 无法获取 Git 提交次数，使用默认值 0')
    return '0'
  }
}

export default defineConfig(({ mode }) => {
  const isUserDebug = mode === 'userdebug'

  // 构建时锁死日期
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const buildDate = `${year}.${month}.${day}`

  // 获取提交次数
  const commitCount = getCommitCount()

  // 生成完整版本号：日期 + 提交次数
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

  console.log('\n📦 构建配置:')
  console.log(`  构建日期: ${buildDate}`)
  console.log(`  提交次数: ${commitCount}`)
  console.log(`  版本号: ${version}`)
  console.log(`  构建时间: ${buildTime}`)
  console.log(`  构建环境: ${buildEnv}`)
  console.log(`  构建者: ${builder}\n`)

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