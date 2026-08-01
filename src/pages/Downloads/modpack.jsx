import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import ScrollReveal from '../../components/ScrollReveal'
import { API_ENDPOINTS } from '../../config'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export default function ModpackList() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getCookie('download_token')
    if (!token) {
      navigate('/verify', { state: { from: window.location.pathname } })
      return
    }
    fetchData(token)
  }, [])

  async function fetchData(token) {
    try {
      const res = await fetch(API_ENDPOINTS.modpacks, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        navigate('/verify', { state: { from: window.location.pathname } })
      }
    } catch (err) {
      console.error('获取数据失败:', err)
    } finally {
      setLoading(false)
    }
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

  const items = data?.items || []
  const tag = data?.tag || ''

  return (
    <>
      <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <button
            onClick={() => navigate('/download')}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            返回资源类型
          </button>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">整合包</h1>
            {tag && <p className="mt-2 text-sm text-muted">当前版本：{tag}</p>}
          </div>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal>
            {items.length === 0 ? (
              <p className="text-center text-muted py-8">暂无整合包</p>
            ) : (
              <div className="grid gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/downloads/modpacks/${item.id}`)}
                    className="bg-surface rounded-container border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                          <Package size={24} weight="bold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-fg">{item.name}</h3>
                            {item.tag && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted">{item.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                            <span>{item.version}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-primary group-hover:translate-x-1 transition-transform">
                        <span className="text-sm font-medium">查看详情</span>
                        <ArrowRight size={18} weight="bold" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}