import { useEffect } from 'react'
import { ArrowsLeftRight } from '@phosphor-icons/react'
import { useLanguageContext } from '../i18n/LanguageContext'

export default function Footer() {
  const { t, locale, switchLanguage, nextLocale } = useLanguageContext()

  useEffect(() => {
    if (__USER_DEBUG__) {
      console.log('[UserDebug] Version:', __VERSION__)
      console.log('[UserDebug] Builder:', __BUILDER__)
      console.log('[UserDebug] Build env:', __BUILD_ENV__)
      console.log('[UserDebug] Build time:', __BUILD_TIME__)
    }
  }, [])

  return (
    <footer className="relative z-10 bg-footer text-muted">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/images/logo2.png" alt="Yanyang" className="h-6 w-auto" />
          <span className="text-white font-semibold text-sm">{t('footer.brand')}</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <a
            href="https://qm.qq.com/q/aBSDTnmJhK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
          >
            {t('footer.qq')}
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
            {t('footer.rail')}
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted/60">
          <a
            href="/docs/yanyangchengshijianshefaan.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            {t('footer.doc1')}
          </a>
          <a
            href="/docs/yanyangruanjianxvkejifuwuxieyi.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            {t('footer.doc2')}
          </a>
          <a
            href="/docs/yanyangertonggerenxinxibaohuguizejijianhurenxvzhi.docx"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            {t('footer.doc3')}
          </a>
        </div>

        <hr className="w-full max-w-xs border-border/20" />

        <div className="text-center text-xs space-y-2">
          <p>{t('footer.rights')}</p>
          <p>{t('footer.version', { version: __VERSION__, buildTime: __BUILD_TIME__, buildEnv: __BUILD_ENV__ })}</p>
          {__USER_DEBUG__ && (
            <p className="text-red-500">{t('footer.debug', { builder: __BUILDER__ })}</p>
          )}
          <button
            onClick={() => switchLanguage(nextLocale)}
            className="inline-flex items-center gap-1 bg-transparent border-transparent text-muted hover:text-fg transition-colors mx-auto"
            title={t('footer.switchLang')}
            aria-label={t('footer.switchLang')}
          >
            <ArrowsLeftRight size={14} weight="bold" />
            <span className="uppercase">{locale}</span>
          </button>
        </div>
      </div>
    </footer>
  )
}
