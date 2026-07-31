import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const isUserDebug = mode === 'userdebug'

  // 构建时锁死日期（不会改变）
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const buildDate = `${year}.${month}.${day}`

  // 构建时生成固定日期，提交次数由前端动态获取
  const version = process.env.VERSION || `${buildDate}.{commitCount}`

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
  console.log(`  构建时间: ${buildTime}`)
  console.log(`  构建环境: ${buildEnv}`)
  console.log(`  构建者: ${builder}\n`)

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __USER_DEBUG__: isUserDebug,
      // 只传递日期部分，提交次数由前端动态获取
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILDER__: JSON.stringify(builder),
      __BUILD_ENV__: JSON.stringify(buildEnv),
      __BUILD_TIME__: JSON.stringify(buildTime),
      // 预留版本号占位，方便调试
      __VERSION__: JSON.stringify(version),
    },
  }
})