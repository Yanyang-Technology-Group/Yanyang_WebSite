import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import ScrollReveal from '../../components/ScrollReveal'
import { API_ENDPOINTS } from '../../config'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

const TAG_COLORS = {
  'PCL2': 'bg-blue-100 text-blue-700 border-blue-200',
  'PCLCE': 'bg-purple-100 text-purple-700 border-purple-200',
  'HMCL': 'bg-green-100 text-green-700 border-green-200'
}

export default function LauncherList() {
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
      const res = await fetch(API_ENDPOINTS.launchers, {
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

  function getGroups() {
    const items = data?.items || []
    const groups = {}
    items.forEach(item => {
      const tag = item.tag || '其他'
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
          <p className="text-muted">加载中...</p>
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
            返回资源类型
          </button>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">启动器</h1>
            <p className="mt-2 text-sm text-muted">Minecraft 游戏启动器</p>
          </div>
        </div>
      </section>

      <section className="bg-bg pb-section">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <ScrollReveal>
            {groupNames.length === 0 ? (
              <p className="text-center text-muted py-8">暂无启动器</p>
            ) : (
              groupNames.map((tag) => (
                <div key={tag} className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 inline-block px-4 py-1.5 rounded-full border ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
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
                            </div>
                          </div>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 active:scale-[0.97] transition-all"
                          >
                            下载
                            <ArrowRight size={16} weight="bold" />
                          </a>
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