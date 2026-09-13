import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js'
import { simpleJWT, verifySimpleJWT } from './services/jwt.js'
import { Env, ServerStats } from './types'

const BAN_DURATION = 24 * 60 * 60 * 1000

const SERVER_STATS_TTL = 120
const STATS_INGEST_PATH = '/api/server/stats/ingest'
let serverStatsMemory: { stats: ServerStats; updatedAt: number } | null = null
const ALLOWED_MAP_ORIGINS = ['umap.odn.cc', 'ymap.odn.cc', '103.40.14.23']
const MAP_PROXY_PREFIX = '/api/map/proxy'
const MAP_TARGET_COOKIE = 'map_target'

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface GeoInfo {
  country?: string
  region?: string
  city?: string
  timezone?: string
}

const COUNTRY_NAMES_ZH: Record<string, string> = {
  CN: '中国', HK: '中国香港', MO: '中国澳门', TW: '中国台湾',
  JP: '日本', KR: '韩国', KP: '朝鲜', MN: '蒙古',
  US: '美国', CA: '加拿大', MX: '墨西哥', BR: '巴西', AR: '阿根廷', CL: '智利',
  GB: '英国', IE: '爱尔兰', FR: '法国', DE: '德国', NL: '荷兰', BE: '比利时',
  CH: '瑞士', AT: '奥地利', IT: '意大利', ES: '西班牙', PT: '葡萄牙', GR: '希腊',
  SE: '瑞典', NO: '挪威', DK: '丹麦', FI: '芬兰', PL: '波兰', CZ: '捷克',
  HU: '匈牙利', RO: '罗马尼亚', UA: '乌克兰', RU: '俄罗斯', TR: '土耳其',
  AU: '澳大利亚', NZ: '新西兰', SG: '新加坡', MY: '马来西亚', TH: '泰国',
  VN: '越南', PH: '菲律宾', IN: '印度', ID: '印度尼西亚', PK: '巴基斯坦',
  SA: '沙特阿拉伯', AE: '阿联酋', IL: '以色列', EG: '埃及', ZA: '南非', KZ: '哈萨克斯坦'
}

function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ||
      request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      'unknown'
}

function getCfGeo(request: Request): GeoInfo | null {
  const cf = (request as Request & { cf?: Record<string, unknown> }).cf
  if (!cf) return null
  const country = typeof cf.country === 'string' ? cf.country : undefined
  const region = typeof cf.region === 'string' ? cf.region : undefined
  const city = typeof cf.city === 'string' ? cf.city : undefined
  const timezone = typeof cf.timezone === 'string' ? cf.timezone : undefined
  if (!country && !region && !city) return null
  return { country, region, city, timezone }
}

interface IpwLocationData {
  ip?: string
  bilibili?: { country?: string; administrative_area?: string; city?: string; isp?: string }
  geocn?: { administrative_area?: string; city?: string; district?: string; isp?: string }
  ip2region?: string
  qqwry?: { country?: string; administrative_area?: string; city?: string; isp?: string }
  maxmind_city?: { country?: string; administrative_area?: string; city?: string }
  dbip_city?: { country?: string; administrative_area?: string; city?: string }
}

// 中国大陆精度：bilibili > geocn > ip2region > qqwry > maxmind；境外：maxmind/dbip 更准
function pickBestGeo(data: IpwLocationData): GeoInfo | null {
  const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

  // 中国大陆：GeoCN 最精确（省市区县），境外无此数据
  const geocn = data.geocn
  if (geocn && (nonEmpty(geocn.administrative_area) || nonEmpty(geocn.city) || nonEmpty(geocn.district))) {
    const parts = [geocn.administrative_area, geocn.city, geocn.district].filter(nonEmpty)
    return { country: '中国', region: parts[0], city: parts.slice(1).join('') }
  }

  // 境外：MaxMind 更准
  const maxmind = data.maxmind_city
  if (maxmind && (nonEmpty(maxmind.administrative_area) || nonEmpty(maxmind.city))) {
    return { country: maxmind.country, region: maxmind.administrative_area, city: maxmind.city }
  }

  // 兜底：bilibili（country/省 偶尔是域名或 ISP 名称如 114DNS.COM，此时不采用）
  const bilibili = data.bilibili
  if (bilibili && (nonEmpty(bilibili.administrative_area) || nonEmpty(bilibili.city))) {
    const suspicious = [bilibili.country, bilibili.administrative_area].some(
      v => typeof v === 'string' && /\./.test(v)
    )
    if (!suspicious) {
      return { country: bilibili.country, region: bilibili.administrative_area, city: bilibili.city }
    }
  }

  if (nonEmpty(data.ip2region)) {
    const parts = data.ip2region.split('|').map(s => s.trim()).filter(Boolean)
    return {
      country: parts[0] || undefined,
      region: parts[1] || undefined,
      city: parts[2] || undefined
    }
  }

  const qqwry = data.qqwry
  if (qqwry && (nonEmpty(qqwry.administrative_area) || nonEmpty(qqwry.city))) {
    return { country: qqwry.country, region: qqwry.administrative_area, city: qqwry.city }
  }

  const dbip = data.dbip_city
  if (dbip && (nonEmpty(dbip.administrative_area) || nonEmpty(dbip.city))) {
    return { country: dbip.country, region: dbip.administrative_area, city: dbip.city }
  }

  return null
}

async function lookupGeoByIP(ip: string): Promise<GeoInfo | null> {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    // ipw 多数据源 IP 归属地查询（bilibili/geocn/ip2region/qqwry/maxmind）
    const res = await fetch(`https://ipw.wsmdn.top/middleware/cn-jiangsu/location/${encodeURIComponent(ip)}`, {
      headers: { 'User-Agent': 'yanyang-backend' },
      signal: controller.signal
    })
    if (!res.ok) return null
    const data = await res.json() as IpwLocationData
    if (typeof data.ip !== 'string') return null
    return pickBestGeo(data)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function getGeoInfo(request: Request, ip: string): Promise<GeoInfo> {
  const ipGeo = await lookupGeoByIP(ip)
  if (ipGeo) return ipGeo
  return getCfGeo(request) || {}
}

function countryName(code: string): string {
  return COUNTRY_NAMES_ZH[code] || code
}

function formatLocation(geo: GeoInfo): string {
  const parts: string[] = []
  if (geo.country) parts.push(countryName(geo.country))
  if (geo.region) parts.push(geo.region)
  if (geo.city) parts.push(geo.city)
  const cleaned = parts.filter(p => p && p.trim() !== '' && p.trim() !== '0')
  return cleaned.length ? cleaned.join(' ') : '未知'
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] || ch
  )
}

function formatLoginTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

interface RequestLog {
  id: string
  timestamp: number
  ip: string
  path: string
  method: string
  status: number
  email?: string
  userAgent?: string
}

async function unbanIP(ip: string, env: Env): Promise<boolean> {
  if (!env.DB) return false
  const result = await env.DB.prepare('DELETE FROM bans WHERE ip = ?').bind(ip).run()
  return result.meta.changes > 0
}

async function getBannedList(env: Env): Promise<{ ip: string; banTime: number; reason: string; remaining: number }[]> {
  if (!env.DB) return []
  const list: { ip: string; banTime: number; reason: string; remaining: number }[] = []
  const now = Date.now()

  const rows = await env.DB.prepare('SELECT ip, ban_time, reason FROM bans').all()
  for (const row of rows.results) {
    const item = row as { ip: string; ban_time: number; reason: string }
    const elapsed = now - item.ban_time
    if (elapsed < BAN_DURATION) {
      list.push({
        ip: item.ip,
        banTime: item.ban_time,
        reason: item.reason,
        remaining: Math.ceil((BAN_DURATION - elapsed) / 1000)
      })
    } else {
      await env.DB.prepare('DELETE FROM bans WHERE ip = ?').bind(item.ip).run()
    }
  }
  return list
}

async function getRequestLogs(env: Env): Promise<RequestLog[]> {
  if (!env.DB) return []
  const logs: RequestLog[] = []
  const rows = await env.DB.prepare('SELECT data FROM logs ORDER BY timestamp DESC LIMIT 100').all()
  for (const row of rows.results) {
    try {
      logs.push(JSON.parse(row.data as string) as RequestLog)
    } catch {
      // 跳过损坏的日志
    }
  }
  return logs
}

async function clearRequestLogs(env: Env): Promise<void> {
  if (!env.DB) return
  await env.DB.prepare('DELETE FROM logs').run()
}

async function verifyAdmin(password: string, env: Env): Promise<boolean> {
  try {
    const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/adminkey.json`
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'User-Agent': 'Cloudflare-Worker',
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    if (!res.ok) return false
    const data: any = await res.json()
    const binary = atob(data.content)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(bytes)
    const config = JSON.parse(text)
    return config.admin_password === password
  } catch {
    return false
  }
}

async function handleAdminLogin(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const { password } = await request.json() as { password: string }
    if (!password) {
      return errorResponse('请提供密码', 400, request)
    }

    const valid = await verifyAdmin(password, env)
    if (!valid) {
      return errorResponse('密码错误', 401, request)
    }

    const token = await simpleJWT({
      admin: true,
      exp: Date.now() + 3600000,
      iat: Date.now()
    }, env.JWT_SECRET)

    scheduleLoginNotification(request, env.LOGIN_NOTIFY_EMAIL || env.CLOUDMAIL_EMAIL, env, ctx)

    return jsonResponse({ success: true, token }, 200, request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('登录失败: ' + errorMessage, 500, request)
  }
}

async function handleGetBannedList(request: Request, env: Env): Promise<Response> {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded || !decoded.admin) {
      return errorResponse('未授权', 401, request)
    }

    const list = await getBannedList(env)
    return jsonResponse({ success: true, data: list }, 200, request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('获取列表失败: ' + errorMessage, 500, request)
  }
}

async function handleAdminUnban(request: Request, env: Env): Promise<Response> {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded || !decoded.admin) {
      return errorResponse('未授权', 401, request)
    }

    const { ip } = await request.json() as { ip: string }
    if (!ip) {
      return errorResponse('请提供 IP 地址', 400, request)
    }

    const success = await unbanIP(ip, env)
    if (success) {
      return jsonResponse({ success: true, message: `IP ${ip} 已解封` }, 200, request)
    } else {
      return jsonResponse({ success: false, message: `IP ${ip} 不在封禁列表中` }, 404, request)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('解封失败: ' + errorMessage, 500, request)
  }
}

async function handleAdminUpdateBan(request: Request, env: Env): Promise<Response> {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded || !decoded.admin) {
      return errorResponse('未授权', 401, request)
    }

    const { ip, duration } = await request.json() as { ip: string; duration: number }
    if (!ip) {
      return errorResponse('请提供 IP 地址', 400, request)
    }
    if (!duration || duration < 1) {
      return errorResponse('请提供有效的封禁时长（分钟）', 400, request)
    }

    if (!env.DB) {
      return errorResponse('数据库未配置', 500, request)
    }

    const existing = await env.DB.prepare('SELECT reason FROM bans WHERE ip = ?').bind(ip).first()
    await env.DB.prepare('INSERT OR REPLACE INTO bans (ip, ban_time, reason) VALUES (?, ?, ?)')
      .bind(ip, Date.now(), (existing as { reason: string } | null)?.reason || `管理员设置封禁 ${duration} 分钟`)
      .run()

    return jsonResponse({
      success: true,
      message: `IP ${ip} 封禁时间已更新为 ${duration} 分钟`
    }, 200, request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('更新封禁失败: ' + errorMessage, 500, request)
  }
}

async function handleGetLogs(request: Request, env: Env): Promise<Response> {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded || !decoded.admin) {
      return errorResponse('未授权', 401, request)
    }

    const logs = await getRequestLogs(env)
    return jsonResponse({ success: true, data: logs }, 200, request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('获取日志失败: ' + errorMessage, 500, request)
  }
}

async function handleClearLogs(request: Request, env: Env): Promise<Response> {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded || !decoded.admin) {
      return errorResponse('未授权', 401, request)
    }

    await clearRequestLogs(env)
    return jsonResponse({ success: true, message: '日志已清空' }, 200, request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('清空日志失败: ' + errorMessage, 500, request)
  }
}

async function handleHealth(request: Request): Promise<Response> {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'yanyang-backend',
    domain: 'backend.www.yanyn.cn',
    version: '1.0.0'
  }, 200, request)
}

async function handleServerStats(request: Request, env: Env): Promise<Response> {
  if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT data FROM server_stats WHERE id = 1').first()
      if (row) {
        return jsonResponse({ success: true, configured: true, data: JSON.parse(row.data as string) }, 200, request)
      }
    } catch (error) {
      console.error('server stats D1 read failed:', error)
    }
  }
  if (serverStatsMemory && Date.now() - serverStatsMemory.updatedAt < SERVER_STATS_TTL * 1000) {
    return jsonResponse({ success: true, configured: true, data: serverStatsMemory.stats }, 200, request)
  }
  return jsonResponse({
    success: true,
    configured: false,
    data: null,
    message: '服务器尚未上报数据，请检查服务器上的采集脚本是否在运行'
  }, 200, request)
}

async function handleServerStatsIngest(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse('仅支持 POST', 405, request)
  }
  const provided = request.headers.get('X-Stats-Token') || ''
  const expected = env.STATS_INGEST_TOKEN || ''
  if (!expected || provided !== expected) {
    return errorResponse('未授权', 401, request)
  }
  try {
    const body = await request.json() as ServerStats
    if (typeof body.hostname !== 'string' || !body.hostname) {
      return errorResponse('缺少 hostname 字段', 400, request)
    }
    const payload: ServerStats = {
      ...body,
      timestamp: body.timestamp || new Date().toISOString()
    }
    serverStatsMemory = { stats: payload, updatedAt: Date.now() }
    if (env.DB) {
      try {
        await env.DB.prepare('INSERT OR REPLACE INTO server_stats (id, data, updated_at) VALUES (1, ?, ?)')
          .bind(JSON.stringify(payload), Date.now())
          .run()
      } catch (error) {
        throw new Error(`D1 写入失败: ${error instanceof Error ? error.message : String(error)}`)
      }
    } else {
      throw new Error('D1 数据库未配置')
    }
    return jsonResponse({ success: true, message: 'ok' }, 200, request)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('上报失败: ' + errorMessage, 400, request)
  }
}

async function handleMapProxy(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const rest = url.pathname.slice(MAP_PROXY_PREFIX.length).replace(/^\/+/, '')
    const target = url.searchParams.get('target')

    // 目标地址：首页请求用 query 参数，子资源请求（相对路径）从 Cookie 读取
    let baseUrl: URL | null = null
    if (target) {
      try {
        baseUrl = new URL(target)
      } catch {
        return new Response('目标地址无效', { status: 400 })
      }
    } else {
      const cookie = request.headers.get('Cookie') || ''
      const match = cookie.match(new RegExp(`${MAP_TARGET_COOKIE}=([^;]+)`))
      if (match) {
        try {
          baseUrl = new URL(decodeURIComponent(match[1]))
        } catch {}
      }
    }

    if (!baseUrl) {
      return new Response('缺少目标地址', { status: 400 })
    }

    if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
      return new Response('仅支持 http/https 目标', { status: 400 })
    }

    if (!ALLOWED_MAP_ORIGINS.includes(baseUrl.hostname)) {
      return new Response('目标地址不在允许列表中', { status: 403 })
    }

    const baseHref = baseUrl.href.endsWith('/') ? baseUrl.href : baseUrl.href + '/'

    // 拼接上游地址：首页取 base/，子资源取 base/rest（保留请求自带的查询参数）
    let fetchUrl = baseHref
    if (rest) fetchUrl += rest
    if (!target && url.search) {
      fetchUrl += url.search
    }

    // 给上游请求加 15 秒超时，避免目标站点无响应时整个请求卡死变成空 500
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let response: Response
    try {
      response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        signal: controller.signal
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      return new Response(`地图服务连接失败，请稍后重试（${reason}）`, { status: 504 })
    } finally {
      clearTimeout(timeout)
    }

    if (!response.ok) {
      return new Response(`地图服务响应错误: ${response.status}`, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || ''
    const isHtml = contentType.includes('text/html')
    const isTextual = isHtml ||
        contentType.includes('javascript') ||
        contentType.includes('json') ||
        contentType.includes('text/css')

    // 二进制资源（瓦片/图片等）直接透传，不做文本改写，避免损坏二进制内容
    if (!isTextual) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    }

    let text = await response.text()

    const targetOrigin = baseUrl.origin
    const originPattern = new RegExp(escapeRegExp(targetOrigin), 'g')

    if (isHtml) {
      const proxyQueryBase = `${url.origin}${MAP_PROXY_PREFIX}?target=${encodeURIComponent(baseHref)}`
      // 重写 HTML 中的相对 src/href 为带 target 参数的绝对代理地址
      text = text.replace(/(src|href)=["'](?!https?:\/\/)(\/?[^"']*)["']/g, (match, attr, path) => {
        const absoluteUrl = path.startsWith('/') ? `${targetOrigin}${path}` : `${baseHref}${path}`
        return `${attr}="${proxyQueryBase}${encodeURIComponent(absoluteUrl)}"`
      })
      // HTML 中写死的绝对地址也改写为代理前缀（子路径由 Cookie 定位目标）
      text = text.replace(originPattern, `${url.origin}${MAP_PROXY_PREFIX}`)
    } else {
      // JS/CSS/JSON：把绝对 origin 引用改写成代理前缀，避免混入 http 资源被浏览器拦截
      text = text.replace(originPattern, `${url.origin}${MAP_PROXY_PREFIX}`)
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType || 'text/html',
      'Cache-Control': isHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    }

    // 首页响应时写入 Cookie，后续相对路径子请求据此找到目标地址
    if (isHtml && !rest) {
      headers['Set-Cookie'] = `${MAP_TARGET_COOKIE}=${encodeURIComponent(baseHref)}; Path=${MAP_PROXY_PREFIX}; Max-Age=3600; SameSite=Lax`
    }

    return new Response(text, {
      status: response.status,
      headers
    })

  } catch (error) {
    console.error('地图代理错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response('地图加载失败: ' + errorMessage, { status: 500 })
  }
}

async function handleWebsiteInfo(request: Request): Promise<Response> {
  return jsonResponse({
    success: true,
    data: {
      name: '晏阳城市建设',
      description: '基于 Minecraft 的城市规划与轨道交通创作服务器',
      domain: 'www.yanyn.cn',
      backend: 'backend.www.yanyn.cn',
      version: '1.0.0'
    }
  }, 200, request)
}

async function sendEmail(to: string, subject: string, html: string, env: Env): Promise<void> {
  if (env.RESEND_TOKEN) {
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_TOKEN}`
      },
      body: JSON.stringify({
        from: '晏阳城市建设 <reply@yanyn.cn>',
        to: [to],
        subject,
        html
      })
    })

    if (!sendRes.ok) {
      const error = await sendRes.text()
      throw new Error(`邮件发送失败: ${sendRes.status} ${error}`)
    }
    return
  }

  if (env.CLOUDMAIL_EMAIL && env.CLOUDMAIL_PASSWORD) {
    const loginRes = await fetch('https://e-mail.yanyn.cn/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.CLOUDMAIL_EMAIL,
        password: env.CLOUDMAIL_PASSWORD
      })
    })

    if (!loginRes.ok) {
      throw new Error(`CloudMail 登录失败: ${loginRes.status}`)
    }

    const loginData = await loginRes.json() as { token?: string; data?: { token?: string } }
    const token = loginData.token || loginData.data?.token

    if (!token) {
      throw new Error('CloudMail 登录失败：未获取到 token')
    }

    const sendRes = await fetch('https://e-mail.yanyn.cn/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': token
      },
      body: JSON.stringify({
        from: 'reply@yanyn.cn',
        to: to,
        subject,
        html
      })
    })

    if (!sendRes.ok) {
      const error = await sendRes.text()
      throw new Error(`邮件发送失败: ${sendRes.status} ${error}`)
    }
    return
  }

  console.log(`[测试模式] 邮件「${subject}」应该发送到 ${to}`)
}

async function sendLoginNotificationEmail(
  to: string,
  info: { ip: string; location: string; time: string },
  env: Env
): Promise<void> {
  const subject = '晏阳城市建设 - 登录提醒'
  const html = `
    <div style="font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 0;">
      <div style="background: linear-gradient(135deg, #3B82F6, #2563EB); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">晏阳城市建设</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 14px; font-weight: 400;">用方块构筑城市与轨道的梦想</p>
      </div>
      <div style="background: #ffffff; padding: 32px 28px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f0f0f0;">
        <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6; margin: 0 0 6px 0;">您好，</p>
        <p style="font-size: 15px; color: #333333; line-height: 1.8; margin: 0 0 24px 0;">您的账号刚刚登录了晏阳城市建设网站，本次登录信息如下：</p>
        <div style="background: #f8faff; border: 2px dashed #dbeafe; border-radius: 12px; padding: 4px 20px; margin-bottom: 28px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eef2ff;">
            <span style="font-size: 13px; color: #888888; letter-spacing: 1px;">登录时间</span>
            <span style="font-size: 14px; color: #1a1a1a; font-weight: 600;">${escapeHtml(info.time)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eef2ff;">
            <span style="font-size: 13px; color: #888888; letter-spacing: 1px;">IP 地址</span>
            <span style="font-size: 14px; color: #1a1a1a; font-weight: 600; font-family: 'Courier New', monospace;">${escapeHtml(info.ip)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
            <span style="font-size: 13px; color: #888888; letter-spacing: 1px;">真实地址</span>
            <span style="font-size: 14px; color: #1a1a1a; font-weight: 600;">${escapeHtml(info.location)}</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #888888; line-height: 1.8; margin: 0 0 8px 0;">如果这不是您本人的操作，请立即联系管理员。</p>
        <p style="font-size: 14px; color: #888888; line-height: 1.8; margin: 0 0 24px 0;">如果不再需要登录提醒，请联系管理员关闭此功能。</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #bbbbbb; text-align: center; margin: 0; letter-spacing: 1px;">Copyright 2025-2026 晏阳技术组</p>
      </div>
    </div>
  `
  await sendEmail(to, subject, html, env)
}

function scheduleLoginNotification(
  request: Request,
  to: string | undefined,
  env: Env,
  ctx: ExecutionContext
): void {
  if (!to) return
  ctx.waitUntil(
    (async () => {
      try {
        const clientIP = getClientIP(request)
        const geo = await getGeoInfo(request, clientIP)
        await sendLoginNotificationEmail(
          to,
          {
            ip: clientIP,
            location: formatLocation(geo),
            time: formatLoginTime(new Date())
          },
          env
        )
      } catch (error) {
        console.error('登录提醒邮件发送失败:', error)
      }
    })()
  )
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) })
    }

    if (path === '/api/health') {
      return handleHealth(request)
    }

    if (path === '/api/server/stats') {
      return handleServerStats(request, env)
    }
    if (path === STATS_INGEST_PATH) {
      return handleServerStatsIngest(request, env)
    }

    if (path === '/api/website/info') {
      return handleWebsiteInfo(request)
    }

    if (path.startsWith('/api/map/proxy')) {
      return handleMapProxy(request, env)
    }

    if (path === '/api/admin/login' && request.method === 'POST') {
      return handleAdminLogin(request, env, ctx)
    }
    if (path === '/api/admin/banned' && request.method === 'GET') {
      return handleGetBannedList(request, env)
    }
    if (path === '/api/admin/unban' && request.method === 'POST') {
      return handleAdminUnban(request, env)
    }
    if (path === '/api/admin/update-ban' && request.method === 'POST') {
      return handleAdminUpdateBan(request, env)
    }
    if (path === '/api/admin/logs' && request.method === 'GET') {
      return handleGetLogs(request, env)
    }
    if (path === '/api/admin/logs/clear' && request.method === 'POST') {
      return handleClearLogs(request, env)
    }

    return errorResponse('API Not Found', 404, request)
  }
}
