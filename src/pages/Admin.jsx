import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Unlock, ArrowClockwise, Clock, XCircle } from '@phosphor-icons/react'
import { API_BASE_URL } from '../config'

function getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

function setCookie(name, value, maxAge = 3600) {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    const secureFlag = isSecure ? '; Secure' : ''
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`
}

function removeCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0`
}

export default function Admin() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [bannedList, setBannedList] = useState([])
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const token = getCookie('admin_token')
        if (token) {
            setIsLoggedIn(true)
            fetchBannedList(token)
        }
    }, [])

    async function handleLogin(e) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })
            const data = await res.json()

            if (res.ok && data.success) {
                setCookie('admin_token', data.token, 3600)
                setIsLoggedIn(true)
                fetchBannedList(data.token)
                setPassword('')
                setMessage('登录成功')
            } else {
                setError(data.message || '登录失败')
            }
        } catch (err) {
            setError('网络错误，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    async function fetchBannedList(token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/banned`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setBannedList(data.data || [])
            } else if (res.status === 401) {
                handleLogout()
            }
        } catch (err) {
            console.error('获取封禁列表失败:', err)
        }
    }

    async function handleUnban(ip) {
        const token = getCookie('admin_token')
        if (!token) return handleLogout()

        if (!confirm(`确定要解封 ${ip} 吗？`)) return

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/unban`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ip })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setMessage(`IP ${ip} 已解封`)
                fetchBannedList(token)
            } else {
                setError(data.message || '解封失败')
            }
        } catch (err) {
            setError('网络错误')
        }
    }

    async function handleUpdateBan(ip) {
        const token = getCookie('admin_token')
        if (!token) return handleLogout()

        const mins = prompt(`请输入 ${ip} 的封禁时长（分钟）：`, '1440')
        if (mins === null) return
        const minsNum = parseInt(mins)
        if (isNaN(minsNum) || minsNum < 1) {
            setError('请输入有效的分钟数（>= 1）')
            return
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/update-ban`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ip, duration: minsNum })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setMessage(`IP ${ip} 封禁时间已更新为 ${minsNum} 分钟`)
                fetchBannedList(token)
            } else {
                setError(data.message || '更新失败')
            }
        } catch (err) {
            setError('网络错误')
        }
    }

    function handleLogout() {
        removeCookie('admin_token')
        setIsLoggedIn(false)
        setBannedList([])
        setMessage('已退出登录')
    }

    function formatTime(seconds) {
        if (seconds < 60) return `${seconds} 秒`
        if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时 ${Math.floor((seconds % 3600) / 60)} 分钟`
        return `${Math.floor(seconds / 86400)} 天 ${Math.floor((seconds % 86400) / 3600)} 小时`
    }

    if (!isLoggedIn) {
        return (
            <section className="min-h-screen bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
                <div className="mx-auto max-w-md px-4 sm:px-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} weight="bold" />
                        </div>
                        <h1 className="text-2xl font-bold text-fg">管理员登录</h1>
                        <p className="text-sm text-muted mt-1">请输入管理员密码</p>
                    </div>

                    <div className="bg-surface rounded-container border border-border p-8">
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="请输入管理员密码"
                                    className="w-full px-4 py-3 bg-bg border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-center"
                                    autoFocus
                                    required
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                                    <XCircle size={16} weight="bold" />
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-btn flex items-center gap-2">
                                    <Lock size={16} weight="bold" />
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full py-3 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '登录中...' : '登录管理后台'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="min-h-screen bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-fg flex items-center gap-3">
                            <Shield size={24} weight="bold" className="text-primary" />
                            管理后台
                        </h1>
                        <p className="text-sm text-muted mt-1">管理被封禁的 IP 地址</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { const token = getCookie('admin_token'); if (token) fetchBannedList(token) }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all"
                        >
                            <ArrowClockwise size={16} weight="bold" />
                            刷新
                        </button>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 border border-red-200 rounded-btn hover:bg-red-50 transition-all"
                        >
                            <Unlock size={16} weight="bold" />
                            退出
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-btn flex items-center gap-2">
                        <Lock size={16} weight="bold" />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-btn flex items-center gap-2">
                        <XCircle size={16} weight="bold" />
                        {error}
                    </div>
                )}

                <div className="bg-surface rounded-container border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        {bannedList.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
                                    <Shield size={32} weight="bold" />
                                </div>
                                <p className="text-muted">当前没有被封禁的 IP</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-surface border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-muted">IP 地址</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted">封禁原因</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted">剩余时间</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted">操作</th>
                                </tr>
                                </thead>
                                <tbody>
                                {bannedList.map((item) => (
                                    <tr key={item.ip} className="border-b border-border last:border-0 hover:bg-white/50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-sm">{item.ip}</td>
                                        <td className="px-4 py-3 text-muted max-w-[200px] truncate">{item.reason || '触发安全防护机制'}</td>
                                        <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                          <Clock size={12} weight="bold" />
                            {formatTime(item.remaining)}
                        </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    onClick={() => handleUnban(item.ip)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-btn text-xs font-medium transition-colors"
                                                >
                                                    解封
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateBan(item.ip)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-btn text-xs font-medium transition-colors"
                                                >
                                                    修改时长
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="mt-4 text-xs text-muted">
                    <p>提示：封禁默认持续 1 天，可手动修改时长（单位：分钟）</p>
                </div>
            </div>
        </section>
    )
}