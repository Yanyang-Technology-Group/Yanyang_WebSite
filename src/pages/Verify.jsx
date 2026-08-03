import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, XCircle, Eye, Envelope, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { API_ENDPOINTS } from '../config'

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [step, setStep] = useState(1)

  const from = location.state?.from || '/download'

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
        document.cookie = `download_token=${data.token}; path=/; max-age=600; SameSite=Lax`
        navigate(from, { replace: true })
      } else {
        setError(data.message || '密码错误，请重试')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
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
        body: JSON.stringify({ password: 'guest123' })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        document.cookie = `download_token=${data.token}; path=/; max-age=600; SameSite=Lax`
        navigate(from, { replace: true })
      } else {
        setError('游客登录失败，请稍后重试')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendCode(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const token = document.querySelector('[name="cf-turnstile-response"]')?.value
    if (!token) {
      setError('请完成人机验证')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(API_ENDPOINTS.findPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstile_token: token })
      })

      const data = await res.json()

      if (res.ok) {
        setCountdown(60)
        setStep(2)
        setError('')
      } else {
        setError(data.message || '发送失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(API_ENDPOINTS.resetPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      })

      const data = await res.json()

      if (res.ok) {
        setMode('login')
        setStep(1)
        setEmail('')
        setCode('')
        setNewPassword('')
        setError('密码重置成功，请重新登录')
      } else {
        setError(data.message || '重置失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'find') {
    return (
      <>
        <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <button
              onClick={() => setMode('login')}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              返回登录
            </button>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">找回密码</h1>
            <p className="mt-3 text-muted">验证邮箱后重置密码</p>
          </div>
        </section>

        <section className="bg-bg pb-section">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <ScrollReveal>
              <div className="bg-surface rounded-container border border-border p-8 sm:p-10">
                {step === 1 ? (
                  <form onSubmit={handleSendCode}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                        <Envelope size={24} weight="bold" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-fg">输入邮箱</h2>
                        <p className="text-sm text-muted">请输入您注册时绑定的邮箱</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        placeholder="请输入QQ邮箱"
                        className="w-full px-4 py-3 bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                      />
                    </div>

                    <div className="mb-4 flex justify-center">
                      <div
                        className="cf-turnstile"
                        data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '你的站点密钥'}
                      />
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                        <XCircle size={16} weight="bold" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '发送中...' : '发送验证码'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleReset}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={24} weight="bold" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-fg">重置密码</h2>
                        <p className="text-sm text-muted">
                          验证码已发送到 {email} {countdown > 0 && `(${countdown}s)`}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="6"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="请输入6位验证码"
                        className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="新密码（英文或数字，1-20位）"
                        className="w-full px-4 py-3 bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                        pattern="[a-zA-Z0-9]{1,20}"
                      />
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                        <XCircle size={16} weight="bold" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !code || !newPassword}
                      className="w-full py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '重置中...' : '重置密码'}
                    </button>

                    {countdown > 0 ? (
                      <p className="mt-3 text-xs text-center text-muted">
                        重新发送 ({countdown}s)
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        className="mt-3 text-xs text-center text-primary hover:underline block w-full"
                      >
                        重新发送验证码
                      </button>
                    )}
                  </form>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">验证访问</h1>
          <p className="mt-3 text-muted">请输入密码以继续访问</p>
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
                  <h2 className="text-xl font-bold text-fg">输入密码</h2>
                  <p className="text-sm text-muted">密码为英文或数字</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="password"
                    maxLength="20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                    placeholder="请输入密码"
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-muted text-center">密码为英文或数字，1-20位</p>
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
                  {loading ? '验证中...' : '验证访问'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode('find')}
                  className="text-xs text-muted hover:text-primary transition-colors"
                >
                  忘记密码？找回密码
                </button>
              </div>

              <div className="mt-2 text-center">
                <button
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="text-sm text-muted hover:text-primary transition-colors flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Eye size={14} weight="regular" />
                  游客想预览？
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}