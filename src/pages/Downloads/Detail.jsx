// pages/Downloads/Detail.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Package, Coffee, Rocket, ArrowLeft, Download, Warning } from '@phosphor-icons/react'
import ScrollReveal from '../../components/ScrollReveal'
import { API_BASE_URL, API_ENDPOINTS } from '../../config'
import { fetchWithAuth } from '../../utils/api'
import { getToken } from '../../utils/cookie'
import { useLanguageContext } from '../../i18n/LanguageContext'

function isExpired(expiryDate) {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
}

const CONFIG = {
    modpack: {
        icon: Package,
        endpoint: API_ENDPOINTS.modpacks,
        backPath: '/downloads/modpack',
        backLabelKey: 'lists.backModpack',
        titleKey: 'lists.modpackTitle',
        iconBg: 'bg-blue-500',
    },
    java: {
        icon: Coffee,
        endpoint: API_ENDPOINTS.java,
        backPath: '/downloads/java',
        backLabelKey: 'lists.backJava',
        titleKey: 'lists.javaTitle',
        iconBg: 'bg-orange-500',
    },
    launcher: {
        icon: Rocket,
        endpoint: API_ENDPOINTS.launchers,
        backPath: '/downloads/launcher',
        backLabelKey: 'lists.backLauncher',
        titleKey: 'lists.launcherTitle',
        iconBg: 'bg-purple-500',
    }
}

const TYPE_MAP = {
    modpacks: 'modpack',
    javas: 'java',
    launchers: 'launcher',
}

export default function Detail() {
    const navigate = useNavigate()
    const location = useLocation()
    const { cleanPath, t } = useLanguageContext()
    const { id } = useParams()
    const type = TYPE_MAP[cleanPath.split('/')[2]]
    const config = CONFIG[type]
    const Icon = config?.icon

    const [item, setItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [downloading, setDownloading] = useState(null)

    useEffect(() => {
        if (!config) {
            navigate('/download')
            return
        }
        const token = getToken()
        if (!token) {
            navigate('/verify', { state: { from: window.location.pathname } })
            return
        }
        fetchData(token)
    }, [id, type])

    async function fetchData(token) {
        setLoading(true)
        setError('')
        const result = await fetchWithAuth(config.endpoint, token)

        if (result.success) {
            const found = result.data?.items?.find(i => i.id === id)
            setItem(found || null)
        } else if (result.status === 401) {
            navigate('/verify', { state: { from: window.location.pathname } })
        } else {
            setError(result.message || t('lists.loadFail'))
        }
        setLoading(false)
    }

    async function handleDownload(dl) {
        const token = getToken()
        if (!token) {
            navigate('/verify', { state: { from: window.location.pathname } })
            return
        }

        setDownloading(dl.name)

        try {
            const res = await fetch(`${API_ENDPOINTS.oneTime}?id=${encodeURIComponent(dl.name)}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()

            if (data.success) {
                if (type === 'modpack' || type === 'launcher') {
                    const redirectUrl = `${API_BASE_URL}/api/download/redirect?link=${encodeURIComponent(dl.link)}&token=${data.token}&sig=${encodeURIComponent(data.signature)}`
                    window.open(redirectUrl, '_blank')
                } else {
                    const extMatch = dl.link?.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/)
                    const filename = `${dl.name}${extMatch ? `.${extMatch[1]}` : '.zip'}`
                    const proxyUrl = `${API_BASE_URL}/api/download/proxy?link=${encodeURIComponent(dl.link)}&token=${data.token}&sig=${encodeURIComponent(data.signature)}&filename=${encodeURIComponent(filename)}`
                    const a = document.createElement('a')
                    a.href = proxyUrl
                    a.download = filename
                    a.style.display = 'none'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                }
            } else {
                alert(data.message || t('lists.generateFail'))
            }
        } catch (err) {
            console.error('Download failed:', err)
            alert(t('common.networkError'))
        } finally {
            setDownloading(null)
        }
    }

    if (loading) {
        return (
            <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
                    <p className="text-muted">{t('lists.loading')}</p>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-btn text-sm hover:bg-primary/90 active:scale-[0.97] transition-transform"
                    >
                        {t('lists.retry')}
                    </button>
                </div>
            </section>
        )
    }

    if (!item) {
        return (
            <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
                    <button
                        onClick={() => navigate(config.backPath)}
                        className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
                    >
                        <ArrowLeft size={14} />
                        {t(config.backLabelKey)}
                    </button>
                    <p className="text-muted">{t('lists.notFound')}</p>
                </div>
            </section>
        )
    }

    const downloads = item.downloads?.length
        ? item.downloads
        : (item.link ? [{ name: item.name, link: item.link, size: item.size }] : [])

    return (
        <>
            <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6">
                    <button
                        onClick={() => navigate(config.backPath)}
                        className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
                    >
                        <ArrowLeft size={14} />
                        {t(config.backLabelKey)}
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{item.name}</h1>
                        <p className="mt-2 text-muted">{item.version} · {item.date}</p>
                        {item.tag && (
                            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-primary text-white rounded-full">
                {item.tag}
              </span>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-bg pb-section">
                <div className="mx-auto max-w-2xl px-4 sm:px-6">
                    <ScrollReveal>
                        <div className="bg-surface rounded-container border border-border p-6 sm:p-8">
                            <h2 className="text-lg font-bold text-fg mb-4">{t('lists.dl')}</h2>

                            {downloads.length === 0 ? (
                                <p className="text-center text-muted py-8">{t('lists.noLinks')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {downloads.map((dl, index) => {
                                        const expired = isExpired(dl.expiry)
                                        return (
                                            <div
                                                key={index}
                                                className={`bg-bg rounded-card p-4 border transition-colors ${
                                                    expired
                                                        ? 'border-red-200 bg-red-50/50 opacity-60'
                                                        : 'border-border hover:border-primary/30'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-base font-semibold text-fg">{dl.name}</h3>
                                                            {expired && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                                  <Warning size={12} weight="bold" />
                                  {t('lists.expired')}
                                </span>
                                                            )}
                                                            {dl.expiry && !expired && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                  {t('lists.validUntil', { expiry: dl.expiry })}
                                </span>
                                                            )}
                                                        </div>
                                                        {dl.size && <p className="text-xs text-muted mt-0.5">{dl.size}</p>}
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        {expired ? (
                                                            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface text-muted text-sm font-medium rounded-btn cursor-not-allowed">
                                <Download size={16} weight="bold" />
                                {t('lists.expired')}
                              </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDownload(dl)}
                                                                disabled={downloading === dl.name}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 active:scale-[0.97] transition-transform"
                                                            >
                                                                <Download size={16} weight="bold" />
                                                                {downloading === dl.name ? t('lists.generating') : t('lists.download')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </>
    )
}
