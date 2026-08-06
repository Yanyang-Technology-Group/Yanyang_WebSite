import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, LockOpen, ArrowClockwise, Clock, XCircle, List, Trash, Eye } from '@phosphor-icons/react'
import { API_BASE_URL } from '../config'
import { useLanguageContext } from '../i18n/LanguageContext'

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
    const { t } = useLanguageContext()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [bannedList, setBannedList] = useState([])
    const [logs, setLogs] = useState([])
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [message, setMessage] = useState('')
    const [activeTab, setActiveTab] = useState('banned') // 'banned' | 'logs'
    const [showLogModal, setShowLogModal] = useState(false)
    const [selectedLog, setSelectedLog] = useState(null)

    useEffect(() => {
        const token = getCookie('admin_token')
        if (token) {
            setIsLoggedIn(true)
            fetchBannedList(token)
            fetchLogs(token)
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
                fetchLogs(data.token)
                setPassword('')
                setMessage(t('admin.loginSuccess'))
            } else {
                setError(data.message || t('admin.loginFail'))
            }
        } catch (err) {
            setError(t('admin.networkError'))
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
            console.error('Failed to fetch banned list:', err)
        }
    }

    async function fetchLogs(token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setLogs(data.data || [])
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err)
        }
    }

    async function handleUnban(ip) {
        const token = getCookie('admin_token')
        if (!token) return handleLogout()

        if (!confirm(t('admin.unbanConfirm', { ip }))) return

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
                setMessage(t('admin.unbanDone', { ip }))
                fetchBannedList(token)
            } else {
                setError(data.message || t('admin.unbanFail'))
            }
        } catch (err) {
            setError(t('admin.networkError'))
        }
    }

    async function handleUpdateBan(ip) {
        const token = getCookie('admin_token')
        if (!token) return handleLogout()

        const mins = prompt(t('admin.updatePrompt', { ip }), '1440')
        if (mins === null) return
        const minsNum = parseInt(mins)
        if (isNaN(minsNum) || minsNum < 1) {
            setError(t('admin.updateInvalid'))
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
                setMessage(t('admin.updateDone', { ip, mins: minsNum }))
                fetchBannedList(token)
            } else {
                setError(data.message || t('admin.updateFail'))
            }
        } catch (err) {
            setError(t('admin.networkError'))
        }
    }

    async function handleClearLogs() {
        const token = getCookie('admin_token')
        if (!token) return handleLogout()

        if (!confirm(t('admin.clearConfirm'))) return

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/logs/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setMessage(t('admin.clearDone'))
                fetchLogs(token)
            } else {
                setError(data.message || t('admin.clearFail'))
            }
        } catch (err) {
            setError(t('admin.networkError'))
        }
    }

    function handleLogout() {
        removeCookie('admin_token')
        setIsLoggedIn(false)
        setBannedList([])
        setLogs([])
        setMessage(t('admin.logoutDone'))
    }

    function formatTime(seconds, t) {
        if (seconds < 60) return t('admin.timeSeconds', { s: seconds })
        if (seconds < 3600) return t('admin.timeMinutes', { m: Math.floor(seconds / 60) })
        if (seconds < 86400) return t('admin.timeHours', { h: Math.floor(seconds / 3600), m: Math.floor((seconds % 3600) / 60) })
        return t('admin.timeDays', { d: Math.floor(seconds / 86400), h: Math.floor((seconds % 86400) / 3600) })
    }

    function formatTimestamp(ts) {
        const d = new Date(ts)
        return d.toLocaleString('zh-CN', { hour12: false })
    }

    function getStatusColor(status) {
        if (status >= 200 && status < 300) return 'text-green-600 bg-green-50'
        if (status >= 400 && status < 500) return 'text-yellow-600 bg-yellow-50'
        if (status >= 500) return 'text-red-600 bg-red-50'
        return 'text-gray-600 bg-gray-50'
    }

    if (!isLoggedIn) {
        return (
            <section className="min-h-screen bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
                <div className="mx-auto max-w-md px-4 sm:px-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
                            <Shield size={32} weight="bold" />
                        </div>
                        <h1 className="text-2xl font-bold text-fg">{t('admin.loginTitle')}</h1>
                        <p className="text-sm text-muted mt-1">{t('admin.loginDesc')}</p>
                    </div>

                    <div className="bg-surface rounded-container border border-border p-8">
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('admin.passwordPlaceholder')}
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
                                {loading ? t('admin.loggingIn') : t('admin.loginBtn')}
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
                            {t('admin.title')}
                        </h1>
                        <p className="text-sm text-muted mt-1">{t('admin.subtitle')}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                const token = getCookie('admin_token')
                                if (token) {
                                    if (activeTab === 'banned') fetchBannedList(token)
                                    else fetchLogs(token)
                                }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all"
                        >
                            <ArrowClockwise size={16} weight="bold" />
                            {t('admin.refresh')}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 border border-red-200 rounded-btn hover:bg-red-50 transition-all"
                        >
                            <LockOpen size={16} weight="bold" />
                            {t('admin.logout')}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-surface rounded-container border border-border p-1">
                    <button
                        onClick={() => setActiveTab('banned')}
                        className={`flex-1 px-4 py-2 rounded-btn text-sm font-medium transition-all ${
                            activeTab === 'banned'
                                ? 'bg-primary text-white'
                                : 'text-muted hover:text-fg hover:bg-bg/50'
                        }`}
                    >
            <span className="flex items-center justify-center gap-2">
              <Lock size={16} weight="bold" />
              {t('admin.bannedTab')}
            </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`flex-1 px-4 py-2 rounded-btn text-sm font-medium transition-all ${
                            activeTab === 'logs'
                                ? 'bg-primary text-white'
                                : 'text-muted hover:text-fg hover:bg-bg/50'
                        }`}
                    >
            <span className="flex items-center justify-center gap-2">
              <List size={16} weight="bold" />
              {t('admin.logsTab')}
            </span>
                    </button>
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

                {/* Banned list tab */}
                {activeTab === 'banned' && (
                    <div className="bg-surface rounded-container border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            {bannedList.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
                                        <Shield size={32} weight="bold" />
                                    </div>
                                    <p className="text-muted">{t('admin.emptyBanned')}</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-surface border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-muted">{t('admin.ip')}</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted">{t('admin.reason')}</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted">{t('admin.remaining')}</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted">{t('admin.actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {bannedList.map((item) => (
                                        <tr key={item.ip} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-sm">{item.ip}</td>
                                            <td className="px-4 py-3 text-muted max-w-[200px] truncate">{item.reason || t('admin.defaultReason')}</td>
                                            <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                            <Clock size={12} weight="bold" />
                              {formatTime(item.remaining, t)}
                          </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => handleUnban(item.ip)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-btn text-xs font-medium transition-colors"
                                                    >
                                                        {t('admin.unban')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateBan(item.ip)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-btn text-xs font-medium transition-colors"
                                                    >
                                                        {t('admin.updateBan')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-border text-xs text-muted">
                            {t('admin.hint')}
                        </div>
                    </div>
                )}

                {/* Logs tab */}
                {activeTab === 'logs' && (
                    <div className="bg-surface rounded-container border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <span className="text-sm text-muted">{t('admin.logsCount', { count: logs.length })}</span>
                            <button
                                onClick={handleClearLogs}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 border border-red-200 rounded-btn hover:bg-red-50 transition-all"
                            >
                                <Trash size={14} weight="bold" />
                                {t('admin.clearLogs')}
                            </button>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            {logs.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted">{t('admin.emptyLogs')}</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-surface sticky top-0 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted">{t('admin.time')}</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted">IP</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted">{t('admin.email')}</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted">{t('admin.status')}</th>
                                        <th className="px-4 py-2.5 text-left font-semibold text-muted">{t('admin.actions')}</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                                            <td className="px-4 py-2.5 text-xs text-muted whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                                            <td className="px-4 py-2.5 font-mono text-xs">{log.ip}</td>
                                            <td className="px-4 py-2.5 text-xs">{log.email || '-'}</td>
                                            <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <button
                                                    onClick={() => { setSelectedLog(log); setShowLogModal(true) }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-primary hover:bg-primary-light rounded-btn transition-colors"
                                                >
                                                    <Eye size={14} weight="bold" />
                                                    {t('admin.details')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Log detail modal */}
            {showLogModal && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)}>
                    <div className="bg-bg rounded-container max-w-lg w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-fg">{t('admin.detailTitle')}</h3>
                            <button
                                onClick={() => setShowLogModal(false)}
                                className="p-1.5 hover:bg-surface rounded-btn transition-colors"
                            >
                                <XCircle size={20} weight="bold" className="text-muted" />
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-muted">{t('admin.time')}：</span>
                                <span className="text-fg">{formatTimestamp(selectedLog.timestamp)}</span>
                            </div>
                            <div>
                                <span className="text-muted">{t('admin.ip')}：</span>
                                <span className="text-fg font-mono">{selectedLog.ip}</span>
                            </div>
                            <div>
                                <span className="text-muted">{t('admin.email')}：</span>
                                <span className="text-fg">{selectedLog.email || '-'}</span>
                            </div>
                            <div>
                                <span className="text-muted">{t('admin.path')}：</span>
                                <span className="text-fg font-mono">{selectedLog.path}</span>
                            </div>
                            <div>
                                <span className="text-muted">{t('admin.method')}：</span>
                                <span className="text-fg">{selectedLog.method}</span>
                            </div>
                            <div>
                                <span className="text-muted">{t('admin.statusCode')}：</span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                  {selectedLog.status}
                </span>
                            </div>
                            <div>
                                <span className="text-muted">{t('admin.userAgent')}：</span>
                                <span className="text-fg text-xs break-all">{selectedLog.userAgent || '-'}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowLogModal(false)}
                            className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-btn text-sm hover:bg-primary/90"
                        >
                            {t('admin.close')}
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
