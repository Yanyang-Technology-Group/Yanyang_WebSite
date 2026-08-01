import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Rocket, ArrowLeft, Download, Copy } from '@phosphor-icons/react'
import ScrollReveal from '../../../components/ScrollReveal'
import { API_ENDPOINTS } from '../../../config'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export default function ModpackDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

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

              {!item.downloads || item.downloads.length === 0 ? (
                <p className="text-muted text-center py-8">暂无下载链接</p>
              ) : (
                <div className="space-y-4">
                  {item.downloads.map((dl, index) => (
                    <div
                      key={index}
                      className="bg-bg rounded-card p-4 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-fg">{dl.name}</h3>
                          {dl.size && <p className="text-xs text-muted mt-1">{dl.size}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <a
                            href={dl.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90"
                          >
                            <Download size={16} weight="bold" />
                            下载
                          </a>
                          <button
                            onClick={() => handleCopy(dl.link)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-muted border border-border rounded-btn hover:bg-surface transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}