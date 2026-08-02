import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, ArrowLeft, Download, Copy, Warning } from '@phosphor-icons/react'
import ScrollReveal from '../../../components/ScrollReveal'
import { API_BASE_URL, API_ENDPOINTS } from '../../../config'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

function isExpired(expiryDate) {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}

export default function ModpackDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    const token = getCookie('download_token')
    if (!token) {
      navigate('/verify', { state: { from: window.location.pathname } })
      return
    }
    fetchData(token)
  }, [id])

  async function fetchData(token) {
    try {
      const res = await fetch(API_ENDPOINTS.modpacks, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        const found = result.data?.items?.find(i => i.id === id)
        setItem(found || null)
      }
    } catch (err) {
      console.error('获取数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleOneTimeDownload(dl) {
    const token = getCookie('download_token')
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
        const redirectUrl = `${API_BASE_URL}/api/download/redirect?link=${encodeURIComponent(dl.link)}&token=${data.token}&ts=${data.timestamp}&sig=${encodeURIComponent(data.signature)}`
        window.open(redirectUrl, '_blank')
      } else {
        alert(data.message || '生成下载链接失败')
      }
    } catch (err) {
      console.error('下载失败:', err)
      alert('网络错误，请稍后重试')
    } finally {
      setDownloading(null)
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-muted">加载中...</p>
        </div>
      </section>
    )
  }

  if (!item) {
    return (
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <button
            onClick={() => navigate('/downloads/modpack')}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            返回整合包列表
          </button>
          <p className="text-muted">版本不存在</p>
        </div>
      </section>
    )
  }

  const downloads = item.downloads || []

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <button
            onClick={() => navigate('/downloads/modpack')}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            返回整合包列表
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
              <h2 className="text-lg font-bold text-fg mb-4">下载</h2>

              {downloads.length === 0 ? (
                <p className="text-center text-muted py-8">暂无下载链接</p>
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
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-semibold text-fg">{dl.name}</h3>
                              {expired && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                                  <Warning size={12} weight="bold" />
                                  已过期
                                </span>
                              )}
                              {dl.expiry && !expired && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                                  有效期至 {dl.expiry}
                                </span>
                              )}
                            </div>
                            {dl.size && <p className="text-xs text-muted mt-0.5">{dl.size}</p>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {expired ? (
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-btn cursor-not-allowed">
                                <Download size={16} weight="bold" />
                                已过期
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOneTimeDownload(dl)}
                                  disabled={downloading === dl.name}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50"
                                >
                                  <Download size={16} weight="bold" />
                                  {downloading === dl.name ? '生成中...' : '下载'}
                                </button>
                                <button
                                  onClick={() => handleCopy(dl.link)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-muted border border-border rounded-btn hover:bg-surface transition-colors"
                                >
                                  <Copy size={14} />
                                </button>
                              </>
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