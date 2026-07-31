import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ArrowLeft, Copy } from '@phosphor-icons/react'
import ScrollReveal from '../../components/ScrollReveal'
import { useAuth } from '../../hooks/useAuth'
import { API_ENDPOINTS } from '../../config'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

const VERSION_INFO = {
  id: '4years',
  name: '4周年特别版',
  version: 'v4.0.5',
  date: '2026-07-16'
}

export default function FourYearsPack() {
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const token = getCookie('download_token')
    if (!token) {
      navigate('/download')
      return
    }
    fetchDownloads(token)
  }, [authLoading])

  async function fetchDownloads(token) {
    try {
      const res = await fetch(API_ENDPOINTS.downloads, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setDownloads(data.downloads || [])
        } else {
          document.cookie = 'download_token=; path=/; max-age=0'
          navigate('/download')
        }
      } else {
        document.cookie = 'download_token=; path=/; max-age=0'
        navigate('/download')
      }
    } catch (err) {
      console.error('获取下载列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
  }

  if (authLoading || loading) {
    return (
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-muted">加载中...</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <button
            onClick={() => navigate('/download')}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            返回版本列表
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">{VERSION_INFO.name}</h1>
          <p className="mt-2 text-muted">{VERSION_INFO.version} · {VERSION_INFO.date}</p>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="bg-surface rounded-container border border-border p-6 sm:p-8">
              <h2 className="text-lg font-bold text-fg mb-4">下载</h2>

              {downloads.length === 0 ? (
                <div className="text-center py-12">
                  <Download size={48} className="text-muted/30 mx-auto mb-3" />
                  <p className="text-muted">暂无可用下载资源</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloads.map((item, index) => (
                    <div
                      key={index}
                      className="bg-bg rounded-card p-4 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-fg mb-1">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted mb-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {item.size && <span className="text-muted">{item.size}</span>}
                            {item.version && <span className="text-muted">v{item.version}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 active:scale-[0.97] transition-all"
                          >
                            <Download size={16} weight="bold" />
                            下载
                          </a>
                          <button
                            onClick={() => handleCopy(item.link)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-colors"
                          >
                            <Copy size={12} />
                            复制链接
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