// pages/Download.jsx
import { useNavigate } from 'react-router-dom'
import { Package, Coffee, Rocket, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import ScrollReveal from '../components/ScrollReveal'
import { useAuth } from '../hooks/useAuth'
import { removeToken } from '../utils/cookie'

const TYPES = [
  {
    id: 'modpack',
    name: '整合包',
    icon: Package,
    description: '晏阳城市建设专用整合包',
    color: 'from-blue-500 to-blue-600',
    path: '/downloads/modpack'
  },
  {
    id: 'java',
    name: 'JDK',
    icon: Coffee,
    description: 'Java 运行环境，Minecraft 运行必备',
    color: 'from-orange-500 to-orange-600',
    path: '/downloads/java'
  },
  {
    id: 'launcher',
    name: '启动器',
    icon: Rocket,
    description: 'Minecraft 游戏启动器',
    color: 'from-purple-500 to-purple-600',
    path: '/downloads/launcher'
  }
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour <= 10) return '早上好'
  if (hour >= 11 && hour <= 12) return '中午好'
  if (hour >= 13 && hour <= 16) return '下午好'
  if (hour >= 17 && hour <= 18) return '傍晚好'
  if (hour >= 19 && hour <= 23) return '晚上好'
  return '害梅税呢'
}

function getRandomPhrase() {
  const hour = new Date().getHours()

  const phrases = {
    morning: [
      '新的一天，新的区块已加载',
      '阳光正好，适合规划新城',
      '晨光中的城市，像素在呼吸',
      '早起的建筑师，已经在画图纸了',
      '第一缕光照在站台上',
      '今天的城市，从一块混凝土开始',
      '晨雾散去，天际线浮现',
      '清早的服务器，格外安静',
      '阳光穿过云层，照亮了铁轨',
      '新的一天，旧的城市，新的故事',
      '晏阳 ( ゜- ゜)つロ 乾杯~'
    ],
    noon: [
      '阳光直射，光影拉满',
      '午后的城市，每一帧都是壁纸',
      '正午的光，在建筑间跳跃',
      '吃个烤土豆，继续干活',
      '烈日下的车站，等风也等你',
      '午后的工地，只有脚步声',
      '阳光穿过脚手架，落在地面上',
      '城市的正午，是模型渲染的最好时刻',
      '阳光炽热，但方块依旧冰冷',
      '午后三点，光影开始倾斜',
      '晏阳 ( ゜- ゜)つロ 乾杯~'
    ],
    afternoon: [
      '下午的光影，是最好的材质包',
      '阳光斜照，建筑的轮廓开始清晰',
      '午后适合放慢节奏，看一座城',
      '阳光在轨道上拉出长长的影子',
      '下午的风，从车站穿过',
      '阳光透过玻璃窗，洒在候车厅',
      '午后四时，城市进入黄金光线',
      '斜阳下的工地，一片宁静',
      '下午的光，让一切都变得柔软',
      '光影流动，城市在呼吸',
      '晏阳 ( ゜- ゜)つロ 乾杯~'
    ],
    evening: [
      '夕阳将城市染成金色',
      '落日余晖，是最好的滤镜',
      '傍晚的站台，列车驶入暮色',
      '晚霞在天际线燃烧',
      '日暮时分，城市换了另一种表情',
      '夕阳下的建筑，轮廓温柔',
      '天黑前的最后一道光',
      '城市在暮色中苏醒',
      '晚风起了，铁轨依旧安静',
      '黄昏是一天中最安静的时刻',
      '晏阳 ( ゜- ゜)つロ 乾杯~'
    ],
    night: [
      '城市的灯亮了，像散落的星辰',
      '夜晚的轨道，通往城市深处',
      '万家灯火，每一扇窗背后都有一个故事',
      '夜色中的建筑，沉默而坚定',
      '站台的灯光，照亮归途',
      '霓虹在夜色中醒来',
      '夜晚的城市，是另一种生活',
      '星光落在铁轨上，闪烁如轨距',
      '城市睡了，但灯光醒着',
      '夜色中的天际线，温柔地站着',
      '晏阳 ( ゜- ゜)つロ 乾杯~'
    ],
    late: [
      '凌晨的城市，只为你一人亮灯',
      '夜深了，城市的图纸还在延展',
      '你在黑夜里建造白天的梦',
      '月光照在铁轨上，像一条银色的线',
      '凌晨三时，城市与星辰同眠',
      '深夜的工地，安静得像在等待',
      '夜行的列车，划过城市边缘',
      '城市睡了，但你的方块还在生长',
      '凌晨的光，是最安静的',
      '你醒着，城市也醒着',
      '晏阳 ( ゜- ゜)つロ 乾杯~'
    ]
  }

  let list = phrases.morning
  if (hour >= 11 && hour <= 12) list = phrases.noon
  else if (hour >= 13 && hour <= 16) list = phrases.afternoon
  else if (hour >= 17 && hour <= 18) list = phrases.evening
  else if (hour >= 19 && hour <= 23) list = phrases.night
  else if (hour >= 0 && hour <= 4) list = phrases.late

  return list[Math.floor(Math.random() * list.length)]
}

export default function DownloadPage() {
  const navigate = useNavigate()
  const { loading } = useAuth()
  const [greeting, setGreeting] = useState('')
  const [phrase, setPhrase] = useState('')
  const [userLabel, setUserLabel] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
    setPhrase(getRandomPhrase())
    const label = localStorage.getItem('user_label')
    if (label) setUserLabel(label)
  }, [])

  function handleReVerify() {
    removeToken()
    localStorage.removeItem('user_label')
    navigate('/verify', { state: { from: '/download' } })
  }

  if (loading) {
    return (
        <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <p className="text-muted">验证中...</p>
          </div>
        </section>
    )
  }

  return (
      <>
        <section className="bg-bg pt-20 pb-10 sm:pt-28 sm:pb-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="flex flex-col items-start mb-2 pl-1">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={handleReVerify}
                    className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                  重新验证
                </button>
                <span className="text-sm text-muted/60">
                {greeting}
              </span>
                {userLabel && (
                    <span className="text-sm text-primary font-medium">
                  {userLabel}
                </span>
                )}
              </div>
              <span className="text-xs text-muted/40 mt-0.5 pl-1">
              {phrase}
            </span>
            </div>
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">资源下载</h1>
              <p className="mt-3 text-muted">选择你要下载的资源类型</p>
            </div>
          </div>
        </section>

        <section className="bg-bg pb-section">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                      <div
                          key={type.id}
                          onClick={() => navigate(type.path)}
                          className="group bg-surface rounded-container border border-border p-8 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${type.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon size={28} weight="bold" />
                        </div>
                        <h3 className="text-xl font-bold text-fg mb-2">{type.name}</h3>
                        <p className="text-sm text-muted leading-relaxed mb-4">{type.description}</p>
                        <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                          <span>查看下载</span>
                          <ArrowRight size={16} weight="bold" />
                        </div>
                      </div>
                  )
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>
      </>
  )
}