// pages/Downloads/launcher.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, ArrowLeft, ArrowRight, FileText } from '@phosphor-icons/react'
import ScrollReveal from '../../components/ScrollReveal'
import { API_BASE_URL, API_ENDPOINTS } from '../../config'
import { fetchWithAuth } from '../../utils/api'
import { getToken } from '../../utils/cookie'
import { useLanguageContext } from '../../i18n/LanguageContext'
import type { DownloadListData, DownloadableItem } from '../../types'

const TAG_COLORS: Record<string, string> = {
  'PCL2': 'bg-blue-100 text-blue-700 border-blue-200',
  'PCLCE': 'bg-purple-100 text-purple-700 border-purple-200',
  'HMCL': 'bg-green-100 text-green-700 border-green-200'
}

const LICENSE_MAP: Record<string, string> = {
  'PCL2': 'PCL LICENSE',
  'PCLCE': 'Apache-2.0',
  'HMCL': 'GPL-3.0'
}

const LICENSE_URL_MAP: Record<string, string> = {
  'PCL2': 'https://github.com/Meloong-Git/PCL/blob/main/LICENCE',
  'PCLCE': 'https://github.com/PCL-Community/PCL-CE/blob/dev/LICENSE',
  'HMCL': 'https://github.com/HMCL-dev/HMCL/blob/main/LICENSE'
}

export default function LauncherList() {
  const navigate = useNavigate()
  const { t } = useLanguageContext()
  const [data, setData] = useState<DownloadListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/verify', { state: { from: window.location.pathname } })
      return
    }
    fetchData(token)
  }, [])

  async function fetchData(token: string) {
    setLoading(true)
    setError('')
    const result = await fetchWithAuth<DownloadListData>(API_ENDPOINTS.launchers, token)

    if (result.success) {
      setData(result.data || null)
    } else if (result.status === 401) {
      navigate('/verify', { state: { from: window.location.pathname } })
    } else {
      setError(result.message || t('lists.loadFail'))
    }
    setLoading(false)
  }

  async function handleDownload(item: DownloadableItem) {
    const token = getToken()
    if (!token) {
      navigate('/verify', { state: { from: window.location.pathname } })
      return
    }

    setDownloading(item.id)

    try {
      const res = await fetch(`${API_ENDPOINTS.oneTime}?id=${encodeURIComponent(item.name)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.success) {
        const redirectUrl = `${API_BASE_URL}/api/download/redirect?link=${encodeURIComponent(item.link || '')}&token=${data.token}&sig=${encodeURIComponent(data.signature)}`
        window.open(redirectUrl, '_blank')
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

  function getGroups(): Record<string, DownloadableItem[]> {
    const items = data?.items || []
    const groups: Record<string, DownloadableItem[]> = {}
    items.forEach((item: DownloadableItem) => {
      const tag = item.tag || t('lists.other')
      if (!groups[tag]) {
        groups[tag] = []
      }
      groups[tag].push(item)
    })
    return groups
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

  const groups = getGroups()
  const groupNames = Object.keys(groups)

  return (
      <>
        <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <button
                onClick={() => navigate('/download')}
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              {t('lists.back')}
            </button>
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{t('lists.launcherTitle')}</h1>
              <p className="mt-2 text-sm text-muted">{t('lists.launcherDesc')}</p>
            </div>
          </div>
        </section>

        <section className="bg-bg pb-section">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <ScrollReveal>
              {groupNames.length === 0 ? (
                  <p className="text-center text-muted py-8">{t('lists.emptyLauncher')}</p>
              ) : (
                  groupNames.map((tag) => (
                      <div key={tag} className="mb-10">
                        <h2 className={`text-xl font-bold mb-4 inline-block px-4 py-1.5 rounded-full border ${TAG_COLORS[tag] || 'bg-surface text-muted border-border'}`}>
                          {tag}
                        </h2>
                        <div className="grid gap-4 mt-4">
                          {groups[tag].map((item) => (
                              <div
                                  key={item.id}
                                  className="bg-surface rounded-container border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                                      <Rocket size={24} weight="bold" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-bold text-fg">{item.name}</h3>
                                      <p className="text-sm text-muted">{item.description}</p>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                                        <span>v{item.version}</span>
                                        <span>•</span>
                                        <span>{item.size}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <FileText size={12} className="text-muted" />
                                        <a
                                            href={LICENSE_URL_MAP[item.tag] || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline"
                                        >
                                          {t('lists.license', { license: LICENSE_MAP[item.tag] || t('lists.unknown') })}
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                      onClick={() => handleDownload(item)}
                                      disabled={downloading === item.id}
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50"
                                  >
                                    {downloading === item.id ? t('lists.generating') : t('lists.download')}
                                    <ArrowRight size={16} weight="bold" />
                                  </button>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  ))
              )}
            </ScrollReveal>
          </div>
        </section>
      </>
  )
}
