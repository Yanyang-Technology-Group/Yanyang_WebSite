import { useState } from 'react'
import { Lock, XCircle } from '@phosphor-icons/react'

export default function PasswordVerify({ onSuccess, title, subtitle }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        localStorage.setItem('download_token', data.token)
        onSuccess(data)
      } else {
        setError(data.message || '密码错误，请重试')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-container border border-border p-8 sm:p-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
          <Lock size={24} weight="bold" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-fg">{title || '验证访问'}</h2>
          <p className="text-sm text-muted">{subtitle || '请输入6位数密码'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="6"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="请输入6位数密码"
            className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            autoFocus
          />
          <p className="mt-2 text-xs text-muted text-center">密码为6位数字</p>
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
    </div>
  )
}