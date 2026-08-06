import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, XCircle, Eye, Envelope, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { API_ENDPOINTS, TOKEN_EXPIRY } from '../config'
import { setToken } from '../utils/cookie'
import { useLanguageContext } from '../i18n/LanguageContext'

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cleanPath, locale, t } = useLanguageContext()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [capToken, setCapToken] = useState('')
  const [capLoaded, setCapLoaded] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const from = location.state?.from || '/download'
  const isPasswordPage = cleanPath === '/verify/password'
  const isSuccessPage = cleanPath === '/verify/password/success'
  const isErrorPage = cleanPath === '/verify/password/error'

  useEffect(() => {
    if (isPasswordPage) {
      const script = document.createElement('script')
      script.src = '/cap.min.js'
      script.onload = () => {
        setCapLoaded(true)
        const checkInterval = setInterval(() => {
          const widget = document.querySelector('cap-widget')
          if (widget && widget.token) {
            setCapToken(widget.token)
            const input = document.querySelector('[name="cap-response"]')
            if (input) input.value = widget.token
            clearInterval(checkInterval)
          }
        }, 500)
        setTimeout(() => clearInterval(checkInterval), 10000)
      }
      script.onerror = () => {
        console.error('Cap failed to load')
      }
      document.body.appendChild(script)
    }
  }, [isPasswordPage])

  useEffect(() => {
    const lock = localStorage.getItem('find_password_lock')
    if (lock) {
      const remaining = Math.ceil((parseInt(lock) - Date.now()) / 1000)
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        localStorage.removeItem('find_password_lock')
      }
    }
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(API_ENDPOINTS.verify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setToken(data.token, TOKEN_EXPIRY)
        localStorage.setItem('user_label', data.label || t('common.user'))
        navigate(from, { replace: true })
      } else {
        setError(data.message || t('verify.errWrong'))
      }
    } catch (err) {
      setError(t('verify.errNetwork'))
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(API_ENDPOINTS.verify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '888888' })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setToken(data.token, TOKEN_EXPIRY)
        localStorage.setItem('user_label', t('common.guest'))
        navigate(from, { replace: true })
      } else {
        setError(t('verify.errGuest'))
      }
    } catch (err) {
      setError(t('verify.errNetwork'))
    } finally {
      setLoading(false)
    }
  }

  async function handleFindPassword(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!capToken) {
      setError(t('verify.fpErrCaptcha'))
      setLoading(false)
      return
    }

    try {
      const res = await fetch(API_ENDPOINTS.verifyPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, cap_token: capToken })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        navigate('/verify/password/success', { replace: true })
        return
      }

      if (res.status === 403) {
        navigate('/verify/password/error', { replace: true })
        return
      }

      if (res.status === 400 && data.message && data.message.includes(t('verify.captchaFailMarker'))) {
        setError(t('verify.fpErrCaptchaFailed'))
        setLoading(false)
        return
      }

      if (res.status === 429) {
        const match = data.message.match(/(\d+)/)
        let seconds = 60
        if (match) {
          seconds = parseInt(match[1])
        }
        const expireTime = Date.now() + seconds * 1000
        localStorage.setItem('find_password_lock', expireTime.toString())
        setCountdown(seconds)
        setLoading(false)
        return
      }

      setError(data.message || t('verify.fpErrSend'))
    } catch (err) {
      setError(t('verify.errNetwork'))
    } finally {
      setLoading(false)
    }
  }

  // ========== Error page ==========
  if (isErrorPage) {
    return (
        <>
          <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} weight="bold" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('verify.errorTitle')}</h1>
              <p className="mt-3 text-muted">{t('verify.errorDesc')}</p>
            </div>
          </section>

          <section className="bg-bg pb-section">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
              <div className="bg-surface rounded-container border border-border p-8 sm:p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} weight="bold" />
                </div>
                <h2 className="text-xl font-bold text-fg mb-2">{t('verify.errorCardTitle')}</h2>
                <p className="text-muted text-sm mb-2">{t('verify.errorCardDesc1')}</p>
                <p className="text-muted text-sm mb-6">{t('verify.errorCardDesc2')}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                      onClick={() => navigate('/verify')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
                  >
                    {t('verify.backLogin')}
                  </button>
                  <button
                      onClick={() => navigate('/')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-muted hover:text-fg border border-border rounded-btn text-sm hover:bg-surface transition-all"
                  >
                    {t('verify.backHome')}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
    )
  }

  // ========== Success page ==========
  if (isSuccessPage) {
    return (
        <>
          <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} weight="bold" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('verify.successTitle')}</h1>
              <p className="mt-3 text-muted">{t('verify.successDesc')}</p>
            </div>
          </section>

          <section className="bg-bg pb-section">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
              <div className="bg-surface rounded-container border border-border p-8 sm:p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
                  <Envelope size={28} weight="bold" />
                </div>
                <h2 className="text-xl font-bold text-fg mb-2">{t('verify.successCardTitle')}</h2>
                <p className="text-muted text-sm mb-6">{t('verify.successCardDesc')}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                      onClick={() => navigate('/verify')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
                  >
                    {t('verify.backLogin')}
                  </button>
                  <button
                      onClick={() => navigate('/')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-muted hover:text-fg border border-border rounded-btn text-sm hover:bg-surface transition-all"
                  >
                    {t('verify.backHome')}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
    )
  }

  // ========== Recover password page ==========
  if (isPasswordPage) {
    return (
        <>
          <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
              <button
                  onClick={() => navigate('/verify')}
                  className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
              >
                <ArrowLeft size={14} />
                {t('verify.backLogin')}
              </button>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('verify.fpTitle')}</h1>
              <p className="mt-3 text-muted">{t('verify.fpDesc')}</p>
            </div>
          </section>

          <section className="bg-bg pb-section">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
              <ScrollReveal>
                <div className="bg-surface rounded-container border border-border p-8 sm:p-10">
                  <form onSubmit={handleFindPassword}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                        <Envelope size={24} weight="bold" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-fg">{t('verify.fpCardTitle')}</h2>
                        <p className="text-sm text-muted">{t('verify.fpCardDesc')}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value.trim())}
                          placeholder={t('verify.fpPlaceholder')}
                          className="w-full px-4 py-3 bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          required
                      />
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-center min-h-[80px] items-center">
                        {capLoaded ? (
                            <cap-widget
                                data-cap-api-endpoint="https://cap.yanyn.cn/api/"
                                id="cap-widget"
                                data-cap-i18n-initial-state={t('verify.capInitial')}
                                data-cap-i18n-verifying-label={t('verify.capVerifying')}
                                data-cap-i18n-solved-label={t('verify.capSolved')}
                                data-cap-i18n-error-label={t('verify.capError')}
                            ></cap-widget>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                              {t('verify.fpLoadingCap')}
                            </div>
                        )}
                      </div>
                      <input type="hidden" name="cap-response" />
                      <p className="text-xs text-muted text-center mt-2">
                        {t('verify.fpCapHint')}
                      </p>
                    </div>

                    {countdown > 0 ? (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                          <XCircle size={16} weight="bold" />
                          {t('verify.fpWait', { countdown })}
                        </div>
                    ) : error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                          <XCircle size={16} weight="bold" />
                          {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email || countdown > 0}
                        className="w-full py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? t('verify.fpRetry', { countdown }) : loading ? t('verify.fpSending') : t('verify.fpSend')}
                    </button>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </>
    )
  }

  // ========== Login page ==========
  return (
      <>
        <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('verify.title')}</h1>
            <p className="mt-3 text-muted">{t('verify.desc')}</p>
          </div>
        </section>

        <section className="bg-bg pb-section">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <ScrollReveal>
              <div className="bg-surface rounded-container border border-border p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                    <Lock size={24} weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-fg">{t('verify.cardTitle')}</h2>
                    <p className="text-sm text-muted">{t('verify.cardDesc')}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        maxLength="20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                        placeholder={t('verify.placeholder')}
                        className={`w-full px-4 py-3 text-center text-2xl bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${locale.startsWith('zh') ? 'tracking-[0.5em]' : 'tracking-[0.2em]'}`}
                        autoFocus
                    />
                    <p className="mt-2 text-xs text-muted text-center">{t('verify.hint')}</p>
                  </div>

                  {error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                        <XCircle size={16} weight="bold" />
                        {error}
                      </div>
                  )}

                  <button
                      type="submit"
                      disabled={loading || password.length < 1}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('verify.submitting') : t('verify.submit')}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-8">
                  <button
                      onClick={handleGuestLogin}
                      disabled={loading}
                      className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={14} weight="regular" />
                    {t('verify.guest')}
                  </button>
                  <button
                      onClick={() => navigate('/verify/password')}
                      className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t('verify.forgot')}
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </>
  )
}
