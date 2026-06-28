import { useEffect } from 'react'

export default function Footer() {
  useEffect(() => {
    if (__USER_DEBUG__) {
      console.log('[UserDebug] 版本:', __VERSION__)
      console.log('[UserDebug] 构建者:', __BUILDER__)
      console.log('[UserDebug] 构建环境:', __BUILD_ENV__)
      console.log('[UserDebug] 构建时间:', __BUILD_TIME__)
    }
  }, [])

  return (
    <footer className="bg-fg text-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/images/logo2.png" alt="晏阳" className="h-6 w-auto" />
          <span className="text-white font-semibold text-sm">晏阳城市建设</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <a
            href="https://qm.qq.com/q/aBSDTnmJhK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            QQ 群 486029013
          </a>
          <a
            href="mailto:feedback@yanyn.cn"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            feedback@yanyn.cn
          </a>
          <a
            href="https://rail.yanyn.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            晏阳轨道交通
          </a>
        </div>

        <hr className="w-full max-w-xs border-border/20" />

        <div className="text-center text-xs space-y-2">
          <p>&copy; 2025-2026 晏阳技术组 版权所有</p>
          <p>版本 {__VERSION__} · 构建于 {__BUILD_TIME__} (UTC+8) · {__BUILD_ENV__} 环境</p>
          {__USER_DEBUG__ && (
            <p className="text-red-500">【测试版本】USER DEBUG 模式 · 构建者：{__BUILDER__}</p>
          )}
        </div>
      </div>
    </footer>
  )
}
