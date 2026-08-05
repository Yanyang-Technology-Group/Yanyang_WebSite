import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, XCircle, Eye, Envelope, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { API_ENDPOINTS, TOKEN_EXPIRY } from '../config'
import { setToken } from '../utils/cookie'

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [capToken, setCapToken] = useState('')
  const [capLoaded, setCapLoaded] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const from = location.state?.from || '/download'
  const isPasswordPage = location.pathname === '/verify/password'
  const isSuccessPage = location.pathname === '/verify/password/success'
  const isErrorPage = location.pathname === '/verify/password/error'

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
        console.error('Cap 加载失败')
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
        localStorage.setItem('user_label', data.label || '用户')
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
        body: JSON.stringify({ password: '888888' })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setToken(data.token, TOKEN_EXPIRY)
        localStorage.setItem('user_label', '游客')
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

  async function handleFindPassword(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!capToken) {
      setError('请完成人机验证')
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

      if (res.status === 429) {
        const match = data.message.match(/(\d+)\s*秒/)
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

      setError(data.message || '发送失败')
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // ========== 错误页面 ==========
  if (isErrorPage) {
    return (
        <>
          <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} weight="bold" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">操作受限</h1>
              <p className="mt-3 text-muted">您触发了安全防护机制</p>
            </div>
          </section>

          <section className="bg-bg pb-section">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
              <div className="bg-surface rounded-container border border-border p-8 sm:p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} weight="bold" />
                </div>
                <h2 className="text-xl font-bold text-fg mb-2">您的操作已被限制</h2>
                <p className="text-muted text-sm mb-2">由于多次密码找回失败，您的 IP 已被暂时封禁。</p>
                <p className="text-muted text-sm mb-6">如需解封，请联系管理员申诉。</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                      onClick={() => navigate('/verify')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
                  >
                    返回登录
                  </button>
                  <button
                      onClick={() => navigate('/')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-muted hover:text-fg border border-border rounded-btn text-sm hover:bg-surface transition-all"
                  >
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
    )
  }

  // ========== 成功页面 ==========
  if (isSuccessPage) {
    return (
        <>
          <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} weight="bold" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">邮件已发送</h1>
              <p className="mt-3 text-muted">密码已发送到您的邮箱，请查收</p>
            </div>
          </section>

          <section className="bg-bg pb-section">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
              <div className="bg-surface rounded-container border border-border p-8 sm:p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
                  <Envelope size={28} weight="bold" />
                </div>
                <h2 className="text-xl font-bold text-fg mb-2">请查收邮件</h2>
                <p className="text-muted text-sm mb-6">我们已将密码发送到您的邮箱，请登录邮箱查看</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                      onClick={() => navigate('/verify')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
                  >
                    返回登录
                  </button>
                  <button
                      onClick={() => navigate('/')}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-muted hover:text-fg border border-border rounded-btn text-sm hover:bg-surface transition-all"
                  >
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
    )
  }

  // ========== 找回密码页面 ==========
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
                返回登录
              </button>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">找回密码</h1>
              <p className="mt-3 text-muted">验证邮箱后，密码将发送到您的邮箱</p>
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

                    <div className="mb-4">
                      <div className="flex justify-center min-h-[80px] items-center">
                        {capLoaded ? (
                            <cap-widget
                                data-cap-api-endpoint="https://cap.yanyn.cn/api/"
                                id="cap-widget"
                            ></cap-widget>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                              加载验证中...
                            </div>
                        )}
                      </div>
                      <input type="hidden" name="cap-response" />
                      <p className="text-xs text-muted text-center mt-2">
                        如长时间未加载，请刷新页面
                      </p>
                    </div>

                    {countdown > 0 ? (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                          <XCircle size={16} weight="bold" />
                          请等待 {countdown} 秒后再试
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
                      {countdown > 0 ? `${countdown}秒后可重试` : loading ? '发送中...' : '发送密码到邮箱'}
                    </button>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </>
    )
  }

  // ========== 登录页面 ==========
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

                <div className="mt-4 flex items-center justify-center gap-8">
                  <button
                      onClick={handleGuestLogin}
                      disabled={loading}
                      className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={14} weight="regular" />
                    游客想预览？
                  </button>
                  <button
                      onClick={() => navigate('/verify/password')}
                      className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </>
  )
}
