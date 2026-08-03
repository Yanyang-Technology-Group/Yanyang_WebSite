import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, XCircle, Eye } from '@phosphor-icons/react'
import ScrollReveal from '../components/ScrollReveal'
import { API_ENDPOINTS } from '../config'

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from || '/download'

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
        body: JSON.stringify({ password: '888888' })
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

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">验证访问</h1>
          <p className="mt-3 text-muted">请输入6位密码以继续访问</p>
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
                  <p className="text-sm text-muted">密码为6位数字或字母</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input
                    type="password"
                    inputMode="text"
                    pattern="[A-Za-z0-9]*"
                    maxLength="6"
                    onChange={(e) => setPassword(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6))}
                    placeholder="请输入6位密码"
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-muted text-center">密码为6位数字或字母</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                    <XCircle size={16} weight="bold" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || password.length !== 6}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '验证中...' : '验证访问'}
                </button>
              </form>

              <div className="mt-6 text-center">
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