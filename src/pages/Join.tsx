import { useState } from 'react'
import { ChatTeardropText, Article, Play, Desktop, Gear, User, Envelope, Cpu, DeviceMobileCamera, HardDrives, WifiHigh } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { useLanguageContext } from '../i18n/LanguageContext'
import type { TFunction } from '../i18n'

function copyToClipboard(text: string, label: string, t: TFunction) {
  navigator.clipboard.writeText(text).then(
    () => {
      const el = document.createElement('div')
      el.textContent = t('join.copied', { label, text })
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-footer text-white text-sm px-4 py-2 rounded-btn shadow-none z-50'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    },
    () => {
      const el = document.createElement('div')
      el.textContent = t('join.copyFail')
      el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-footer text-white text-sm px-4 py-2 rounded-btn shadow-none z-50'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  )
}

export default function Join() {
  const { t } = useLanguageContext()
  return (
    <>
      {/* Hero */}
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('join.hero.title')}</h1>
          <p className="mt-3 text-muted">
            {t('join.hero.desc')}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              {[
                { step: 1, icon: ChatTeardropText, titleKey: 'join.s1.title', descKey: 'join.s1.desc', highlight: true },
                { step: 2, icon: Article, titleKey: 'join.s2.title', descKey: 'join.s2.desc', highlight: false },
                { step: 3, icon: Play, titleKey: 'join.s3.title', descKey: 'join.s3.desc', highlight: false },
              ].map(({ step, icon: Icon, titleKey, descKey, highlight }) => (
                <div
                  key={step}
                  className={`flex-1 p-6 rounded-container border text-center ${
                    highlight
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg border-border text-fg'
                  }`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-card mb-4 ${
                      highlight ? 'bg-white/20 text-white' : 'bg-primary-light text-primary'
                    }`}
                  >
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className={`text-lg font-bold ${highlight ? 'text-white' : 'text-fg'} mb-2`}>
                    {step}. {t(titleKey)}
                  </h3>
                  <p className={`text-sm leading-relaxed ${highlight ? 'text-white/70' : 'text-muted'}`}>
                    {t(descKey)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <div className="mt-8 text-center">
            <a
              href="https://qm.qq.com/q/aBSDTnmJhK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
            >
              <ChatTeardropText size={18} weight="bold" />
              {t('join.qqBtn')}
            </a>
          </div>
        </div>
      </section>

      {/* Server Info */}
      <section className="bg-surface py-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <ScrollReveal delay={80}>
            <h2 className="text-xl font-bold text-fg mb-6">{t('join.server.title')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Desktop, labelKey: 'join.server.game', value: 'Java 1.20.1' },
                { icon: Gear, labelKey: 'join.server.core', value: 'Fabric + MTR 4' },
                { icon: User, labelKey: 'join.server.qq', value: '486029013', copyable: true },
                { icon: Envelope, labelKey: 'join.server.email', value: 'feedback@yanyn.cn', copyable: true },
              ].map(({ icon: Icon, labelKey, value, copyable }) => (
                <div
                  key={labelKey}
                  className={`bg-bg rounded-container p-4 border border-border ${
                    copyable ? 'cursor-pointer hover:border-primary/30 active:scale-[0.97] transition-all' : ''
                  }`}
                  onClick={() => copyable && copyToClipboard(value, t(labelKey), t)}
                  title={copyable ? t('join.copyTip', { label: t(labelKey) }) : undefined}
                >
                  <Icon size={20} weight="bold" className="text-primary mb-2" />
                  <div className="text-xs text-muted mb-1">{t(labelKey)}</div>
                  <div className="text-sm font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <h2 className="text-xl font-bold text-fg mt-8 mb-6">{t('join.hw.title')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Cpu, labelKey: 'join.hw.cpu', value: 'E5-2698B V3 16C32T' },
                { icon: DeviceMobileCamera, labelKey: 'join.hw.ram', value: '32GB DDR3 1866MHz' },
                { icon: HardDrives, labelKey: 'join.hw.disk', value: '512GB NVMe SSD' },
                { icon: WifiHigh, labelKey: 'join.hw.net', value: '1000M↓ / 80M↑' },
              ].map(({ icon: Icon, labelKey, value }) => (
                <div key={labelKey} className="bg-bg rounded-container p-4 border border-border">
                  <Icon size={20} weight="bold" className="text-primary mb-2" />
                  <div className="text-xs text-muted mb-1">{t(labelKey)}</div>
                  <div className="text-sm font-semibold text-fg">{value}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <h2 className="text-xl font-bold text-fg mt-8 mb-6">{t('join.tech.title')}</h2>
            <div className="flex flex-wrap items-center gap-8">
              <a href="https://www.passnat.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-surface rounded-container hover:bg-bg transition-colors">
                <img src="/images/join/frp.svg" alt="FRP" className="h-8 w-auto" />
                <span className="text-sm font-medium">
                  <span className=" font-bold text-base">PassNAT</span>
                  <span className="text-muted mx-2"> </span>
                  <span className="text-fg">{t('join.tech.frp')}</span>
                </span>
              </a>
              <a href="https://www.cloudflare-cn.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-surface rounded-container hover:bg-bg transition-colors">
                <img src="/images/join/cf.png" alt="CDN" className="h-8 w-auto" />
                <span className="text-sm font-medium text-fg">{t('join.tech.cdn')}</span>
              </a>
              <a href="https://github.com/Yanyang-Technology-Group/Yanyang_WebSite" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-surface rounded-container hover:bg-bg transition-colors">
                <img src="/images/join/github.svg" alt="CDN" className="h-8 w-auto" />
                <span className="text-sm font-medium text-fg">{t('join.tech.source')}</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bg py-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal delay={240}>
            <h2 className="text-xl font-bold text-fg mb-6">{t('join.faq.title')}</h2>
            <div className="divide-y divide-border border border-border rounded-container bg-bg">
              {[
                { qKey: 'join.faq.q1', aKey: 'join.faq.a1' },
                { qKey: 'join.faq.q2', aKey: 'join.faq.a2' },
                { qKey: 'join.faq.q3', aKey: 'join.faq.a3' },
                { qKey: 'join.faq.q4', aKey: 'join.faq.a4' },
              ].map(({ qKey, aKey }) => (
                <FAQItem key={qKey} question={t(qKey)} answer={t(aKey)} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-fg hover:bg-surface/50 transition-colors"
      >
        {question}
        <span className={`ml-4 transition-transform text-muted ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-muted leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  )
}
