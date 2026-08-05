import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js'
import { getDownkey, getModpacks, getJava, getLaunchers, verifyPassword } from './services/github.js'
import { simpleJWT, verifySimpleJWT } from './services/jwt.js'
import { Env, PasswordEntry, DownloadItem } from './types'

const TOKEN_EXPIRY = 3600000

const BAN_DURATION = 24 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 60000

const KV_KEY_BAN_PREFIX = 'ban:'
const KV_KEY_BAN_LIST = 'ban:list'
const KV_KEY_RATE_PREFIX = 'rate:'
const KV_KEY_LOG_PREFIX = 'log:'
const KV_KEY_LOG_LIST = 'log:list'

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

function filterByType<T extends { public?: boolean }>(items: T[], passwordType: string): T[] {
  if (passwordType === 'full') {
    return items
  }
  if (passwordType === 'public') {
    return items.filter(item => item.public === true)
  }
  return items
}

function generateOneTimeToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (auth && auth.startsWith('Bearer ')) {
    return auth.replace('Bearer ', '')
  }

  const cookie = request.headers.get('Cookie')
  if (cookie) {
    const match = cookie.match(/download_token=([^;]+)/)
    if (match) {
      return match[1]
    }
  }

  return null
}

async function signLink(link: string, token: string, env: Env): Promise<{ token: string; signature: string }> {
  const encoder = new TextEncoder()
  const secret = env.ONE_TIME_SECRET || 'yanyang-one-time-secret-2026'
  const message = `${link}|${token}|${secret}`

  const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const signatureArray = new Uint8Array(signature)
  let signatureStr = ''
  for (let i = 0; i < signatureArray.length; i++) {
    signatureStr += String.fromCharCode(signatureArray[i])
  }

  return { token, signature: btoa(signatureStr) }
}

async function verifySignedLink(link: string, token: string, signature: string, env: Env): Promise<{ valid: boolean; reason?: string }> {
  const secret = env.ONE_TIME_SECRET || 'yanyang-one-time-secret-2026'
  const encoder = new TextEncoder()
  const message = `${link}|${token}|${secret}`

  const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
  )

  const signatureStr = atob(signature)
  const signatureBytes = new Uint8Array(signatureStr.length)
  for (let i = 0; i < signatureStr.length; i++) {
    signatureBytes[i] = signatureStr.charCodeAt(i)
  }

  const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(message)
  )

  if (!isValid) {
    return { valid: false, reason: '签名无效' }
  }

  if (env.KV) {
    const used = await env.KV.get(`used_token:${token}`)
    if (used) {
      return { valid: false, reason: '链接已被使用' }
    }
  }

  return { valid: true }
}

async function markTokenUsed(token: string, env: Env): Promise<void> {
  if (env.KV) {
    await env.KV.put(`used_token:${token}`, '1', { expirationTtl: 3600 })
  }
}

async function isIPBanned(ip: string, env: Env): Promise<{ banned: boolean; remaining?: number; reason?: string }> {
  if (!env.KV) return { banned: false }

  const key = `${KV_KEY_BAN_PREFIX}${ip}`
  const data = await env.KV.get(key, 'json') as { banTime: number; reason: string } | null

  if (!data) return { banned: false }

  const elapsed = Date.now() - data.banTime
  if (elapsed >= BAN_DURATION) {
    await env.KV.delete(key)
    return { banned: false }
  }

  const remaining = Math.ceil((BAN_DURATION - elapsed) / 1000)
  return { banned: true, remaining, reason: data.reason }
}

async function banIP(ip: string, reason: string, env: Env): Promise<void> {
  if (!env.KV) return

  const key = `${KV_KEY_BAN_PREFIX}${ip}`
  await env.KV.put(key, JSON.stringify({
    banTime: Date.now(),
    reason: reason
  }), { expirationTtl: Math.ceil(BAN_DURATION / 1000) })
}

async function unbanIP(ip: string, env: Env): Promise<boolean> {
  if (!env.KV) return false

  const key = `${KV_KEY_BAN_PREFIX}${ip}`
  const exists = await env.KV.get(key)
  if (!exists) return false

  await env.KV.delete(key)
  return true
}

async function getBannedList(env: Env): Promise<{ ip: string; banTime: number; reason: string; remaining: number }[]> {
  if (!env.KV) return []

  const list: { ip: string; banTime: number; reason: string; remaining: number }[] = []
  const now = Date.now()

  const indexData = await env.KV.get(KV_KEY_BAN_LIST, 'json') as string[] | null
  if (!indexData) return []

  for (const ip of indexData) {
    const key = `${KV_KEY_BAN_PREFIX}${ip}`
    const data = await env.KV.get(key, 'json') as { banTime: number; reason: string } | null
    if (data) {
      const elapsed = now - data.banTime
      if (elapsed < BAN_DURATION) {
        list.push({
          ip,
          banTime: data.banTime,
          reason: data.reason,
          remaining: Math.ceil((BAN_DURATION - elapsed) / 1000)
        })
      } else {
        await env.KV.delete(key)
      }
    }
  }

  const activeIPs = list.map(item => item.ip)
  await env.KV.put(KV_KEY_BAN_LIST, JSON.stringify(activeIPs))

  return list
}

async function addToBanList(ip: string, env: Env): Promise<void> {
  if (!env.KV) return

  const indexData = await env.KV.get(KV_KEY_BAN_LIST, 'json') as string[] | null
  const list = indexData || []
  if (!list.includes(ip)) {
    list.push(ip)
    await env.KV.put(KV_KEY_BAN_LIST, JSON.stringify(list))
  }
}

async function removeFromBanList(ip: string, env: Env): Promise<void> {
  if (!env.KV) return

  const indexData = await env.KV.get(KV_KEY_BAN_LIST, 'json') as string[] | null
  if (!indexData) return

  const list = indexData.filter(item => item !== ip)
  await env.KV.put(KV_KEY_BAN_LIST, JSON.stringify(list))
}

async function saveRequestLog(log: Omit<RequestLog, 'id' | 'timestamp'>, env: Env): Promise<void> {
  if (!env.KV) return

  const id = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const entry: RequestLog = {
    id,
    timestamp: Date.now(),
    ...log
  }

  await env.KV.put(`${KV_KEY_LOG_PREFIX}${id}`, JSON.stringify(entry), { expirationTtl: 86400 * 7 })

  const indexData = await env.KV.get(KV_KEY_LOG_LIST, 'json') as string[] | null
  const list = indexData || []
  list.push(id)
  if (list.length > 100) {
    const removed = list.splice(0, list.length - 100)
    for (const oldId of removed) {
      await env.KV.delete(`${KV_KEY_LOG_PREFIX}${oldId}`)
    }
  }
  await env.KV.put(KV_KEY_LOG_LIST, JSON.stringify(list))
}

async function getRequestLogs(env: Env): Promise<RequestLog[]> {
  if (!env.KV) return []

  const indexData = await env.KV.get(KV_KEY_LOG_LIST, 'json') as string[] | null
  if (!indexData) return []

  const logs: RequestLog[] = []
  for (const id of indexData) {
    const data = await env.KV.get(`${KV_KEY_LOG_PREFIX}${id}`, 'json') as RequestLog | null
    if (data) {
      logs.push(data)
    }
  }
  return logs
}

async function clearRequestLogs(env: Env): Promise<void> {
  if (!env.KV) return

  const indexData = await env.KV.get(KV_KEY_LOG_LIST, 'json') as string[] | null
  if (!indexData) return

  for (const id of indexData) {
    await env.KV.delete(`${KV_KEY_LOG_PREFIX}${id}`)
  }
  await env.KV.delete(KV_KEY_LOG_LIST)
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

async function handleAdminLogin(request: Request, env: Env): Promise<Response> {
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
      await removeFromBanList(ip, env)
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

    const key = `${KV_KEY_BAN_PREFIX}${ip}`
    const existing = await env.KV.get(key, 'json') as { banTime: number; reason: string } | null

    await env.KV.put(key, JSON.stringify({
      banTime: Date.now(),
      reason: existing?.reason || `管理员设置封禁 ${duration} 分钟`
    }), { expirationTtl: duration * 60 })

    await addToBanList(ip, env)

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

async function handleVerify(request: Request, env: Env): Promise<Response> {
  try {
    console.log('=== 开始验证 ===')
    console.log('GITHUB_TOKEN 是否存在:', !!env.GITHUB_TOKEN)
    console.log('REPO_OWNER:', env.REPO_OWNER)
    console.log('REPO_NAME:', env.REPO_NAME)

    const { password } = await request.json() as { password: string }
    console.log('收到密码:', password)

    if (!password || typeof password !== 'string') {
      return errorResponse('请提供密码', 400, request)
    }

    if (password.length < 1 || password.length > 20 || !/^[a-zA-Z0-9]+$/.test(password)) {
      return errorResponse('密码格式错误（仅限英文和数字，1-20位）', 400, request)
    }

    console.log('开始获取 GitHub 数据')
    const passwordInfo = await verifyPassword(password, env)
    console.log('密码验证结果:', passwordInfo)

    if (!passwordInfo) {
      console.log('密码不匹配')
      return errorResponse('密码错误', 401, request)
    }

    console.log('密码匹配，生成 token')
    const token = await simpleJWT({
      verified: true,
      type: passwordInfo.type,
      exp: Date.now() + TOKEN_EXPIRY,
      iat: Date.now()
    }, env.JWT_SECRET)

    const modpacks = await getModpacks(env)
    const java = await getJava(env)
    const launchers = await getLaunchers(env)

    const filteredModpacks = {
      ...modpacks,
      items: filterByType(modpacks.items || [], passwordInfo.type)
    }

    const filteredJava = {
      ...java,
      items: filterByType(java.items || [], passwordInfo.type)
    }

    const filteredLaunchers = {
      ...launchers,
      items: filterByType(launchers.items || [], passwordInfo.type)
    }

    return jsonResponse({
      success: true,
      token: token,
      type: passwordInfo.type,
      label: passwordInfo.label,
      modpacks: filteredModpacks,
      java: filteredJava,
      launchers: filteredLaunchers
    }, 200, request)

  } catch (error) {
    console.error('验证错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误，请稍后重试: ' + errorMessage, 500, request)
  }
}

async function handleOneTimeDownload(request: Request, env: Env): Promise<Response> {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return errorResponse('未授权', 401, request)
    }
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded) {
      return errorResponse('token无效或已过期', 401, request)
    }

    const url = new URL(request.url)
    const linkId = url.searchParams.get('id')
    if (!linkId) {
      return errorResponse('缺少链接ID', 400, request)
    }

    const modpacks = await getModpacks(env)
    const java = await getJava(env)
    const launchers = await getLaunchers(env)
    const allItems = [...(modpacks.items || []), ...(java.items || []), ...(launchers.items || [])]

    let targetLink: string | null = null
    for (const item of allItems) {
      if ('downloads' in item && Array.isArray(item.downloads)) {
        const found = (item.downloads as DownloadItem[]).find(d => d.name === linkId)
        if (found) {
          targetLink = found.link
          break
        }
      }
      if ('link' in item && item.link && item.name === linkId) {
        targetLink = item.link
        break
      }
    }

    if (!targetLink) {
      return errorResponse('链接不存在', 404, request)
    }

    const oneTimeToken = generateOneTimeToken()
    const signed = await signLink(targetLink, oneTimeToken, env)

    return jsonResponse({
      success: true,
      token: oneTimeToken,
      signature: signed.signature
    }, 200, request)

  } catch (error) {
    console.error('生成一次性链接错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误: ' + errorMessage, 500, request)
  }
}

async function handleRedirect(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const link = url.searchParams.get('link')
    const token = url.searchParams.get('token')
    const sig = url.searchParams.get('sig')

    if (!link || !token || !sig) {
      return new Response('链接参数不完整', { status: 400 })
    }

    const result = await verifySignedLink(link, token, sig, env)

    if (!result.valid) {
      return new Response(result.reason || '链接无效', { status: 403 })
    }

    await markTokenUsed(token, env)

    return Response.redirect(link, 302)

  } catch (error) {
    console.error('重定向错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response('服务器错误: ' + errorMessage, { status: 500 })
  }
}

async function handleProxyDownload(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const sig = url.searchParams.get('sig')
    const link = url.searchParams.get('link')
    const filename = url.searchParams.get('filename') || 'download'

    if (!token || !sig || !link) {
      return new Response('参数不完整', { status: 400 })
    }

    const result = await verifySignedLink(link, token, sig, env)

    if (!result.valid) {
      return new Response(result.reason || '链接无效', { status: 403 })
    }

    await markTokenUsed(token, env)

    const response = await fetch(link, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://www.123pan.com/',
        'Origin': 'https://www.123pan.com'
      }
    })

    if (!response.ok) {
      return new Response(`文件获取失败: ${response.status}`, { status: response.status })
    }

    const contentDisposition = response.headers.get('content-disposition') || `attachment; filename="${encodeURIComponent(filename)}"`

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('代理下载错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response('服务器错误: ' + errorMessage, { status: 500 })
  }
}

async function handleMapProxy(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const target = url.searchParams.get('target')

    if (!target) {
      return new Response('缺少目标地址', { status: 400 })
    }

    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    })

    if (!response.ok) {
      return new Response(`地图服务响应错误: ${response.status}`, { status: response.status })
    }

    let html = await response.text()

    const proxyBase = `${url.origin}${url.pathname}?target=`
    const targetOrigin = new URL(target).origin

    html = html.replace(/(src|href)=["'](?!https?:\/\/)(\/?[^"']*)["']/g, (match, attr, path) => {
      const absoluteUrl = path.startsWith('/') ? `${targetOrigin}${path}` : `${targetOrigin}/${path}`
      return `${attr}="${proxyBase}${encodeURIComponent(absoluteUrl)}"`
    })

    html = html.replace(new RegExp(targetOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `${url.origin}${url.pathname}?target=${encodeURIComponent(targetOrigin)}`)

    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('地图代理错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response('地图加载失败: ' + errorMessage, { status: 500 })
  }
}

async function handleModpacks(request: Request, env: Env): Promise<Response> {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return errorResponse('未授权', 401, request)
    }
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded) {
      return errorResponse('token无效或已过期', 401, request)
    }
    const data = await getModpacks(env)
    const filtered = {
      ...data,
      items: filterByType(data.items || [], decoded.type || 'full')
    }
    return jsonResponse({ success: true, data: filtered }, 200, request)
  } catch (error) {
    console.error('获取整合包错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误: ' + errorMessage, 500, request)
  }
}

async function handleJava(request: Request, env: Env): Promise<Response> {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return errorResponse('未授权', 401, request)
    }
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded) {
      return errorResponse('token无效或已过期', 401, request)
    }
    const data = await getJava(env)
    const filtered = {
      ...data,
      items: filterByType(data.items || [], decoded.type || 'full')
    }
    return jsonResponse({ success: true, data: filtered }, 200, request)
  } catch (error) {
    console.error('获取JDK错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误: ' + errorMessage, 500, request)
  }
}

async function handleLaunchers(request: Request, env: Env): Promise<Response> {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return errorResponse('未授权', 401, request)
    }
    const decoded = await verifySimpleJWT(token, env.JWT_SECRET)
    if (!decoded) {
      return errorResponse('token无效或已过期', 401, request)
    }
    const data = await getLaunchers(env)
    const filtered = {
      ...data,
      items: filterByType(data.items || [], decoded.type || 'full')
    }
    return jsonResponse({ success: true, data: filtered }, 200, request)
  } catch (error) {
    console.error('获取启动器错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误: ' + errorMessage, 500, request)
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

async function verifyCap(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://cap.yanyn.cn/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await response.json() as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}

async function handleFindPassword(request: Request, env: Env): Promise<Response> {
  console.log('=== handleFindPassword 被调用 ===')
  console.log('env.KV 是否存在:', !!env.KV)

  let clientIP = 'unknown'
  let userAgent = ''
  let email = ''
  let statusCode = 200

  try {
    clientIP = request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        'unknown'
    userAgent = request.headers.get('User-Agent') || ''

    const banCheck = await isIPBanned(clientIP, env)
    if (banCheck.banned) {
      statusCode = 403
      const remaining = banCheck.remaining || 0
      const hours = Math.floor(remaining / 3600)
      const minutes = Math.ceil((remaining % 3600) / 60)
      const timeStr = hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
      await saveRequestLog({
        ip: clientIP,
        path: '/api/verify/password',
        method: 'POST',
        status: 403,
        email: email,
        userAgent: userAgent
      }, env)
      return errorResponse(
          `您的 IP 已被暂时封禁（剩余 ${timeStr}），请联系管理员申诉解封\n管理员邮箱：feedback@yanyn.cn`,
          403,
          request
      )
    }

    const { email: reqEmail, cap_token } = await request.json() as { email: string; cap_token: string }
    email = reqEmail

    if (!email || !cap_token) {
      statusCode = 400
      await saveRequestLog({
        ip: clientIP,
        path: '/api/verify/password',
        method: 'POST',
        status: 400,
        email: email,
        userAgent: userAgent
      }, env)
      return errorResponse('参数不完整', 400, request)
    }

    const capValid = await verifyCap(cap_token)
    if (!capValid) {
      statusCode = 400
      await saveRequestLog({
        ip: clientIP,
        path: '/api/verify/password',
        method: 'POST',
        status: 400,
        email: email,
        userAgent: userAgent
      }, env)
      return errorResponse('人机验证失败', 400, request)
    }

    const now = Date.now()
    const rateKey = `${KV_KEY_RATE_PREFIX}${email}`
    let record = null
    if (env.KV) {
      const raw = await env.KV.get(rateKey)
      if (raw) {
        try {
          record = JSON.parse(raw)
        } catch {
          record = null
        }
      }
    }

    if (record) {
      const elapsed = now - record.firstSendTime
      if (elapsed < RATE_LIMIT_WINDOW) {
        if (record.count >= MAX_ATTEMPTS) {
          statusCode = 403
          await banIP(clientIP, '连续5次密码找回失败，触发安全防护机制', env)
          await addToBanList(clientIP, env)
          await saveRequestLog({
            ip: clientIP,
            path: '/api/verify/password',
            method: 'POST',
            status: 403,
            email: email,
            userAgent: userAgent
          }, env)
          return errorResponse(
              '您已被暂时封禁（1天），请联系管理员申诉解封\n管理员邮箱：feedback@yanyn.cn',
              403,
              request
          )
        }

        const remaining = Math.ceil((RATE_LIMIT_WINDOW - elapsed) / 1000)
        statusCode = 429
        await saveRequestLog({
          ip: clientIP,
          path: '/api/verify/password',
          method: 'POST',
          status: 429,
          email: email,
          userAgent: userAgent
        }, env)
        return errorResponse(`请等待 ${remaining} 秒后再试`, 429, request)
      }

      if (env.KV) {
        await env.KV.put(rateKey, JSON.stringify({
          count: 1,
          firstSendTime: now,
          ip: clientIP
        }), { expirationTtl: 120 })
      }
    } else {
      if (env.KV) {
        await env.KV.put(rateKey, JSON.stringify({
          count: 1,
          firstSendTime: now,
          ip: clientIP
        }), { expirationTtl: 120 })
      }
    }

    const data = await getDownkey(env)
    const passwords = data.passwords || []
    const found = passwords.find(p => p.email === email)

    if (!found) {
      if (env.KV) {
        const raw = await env.KV.get(rateKey)
        if (raw) {
          try {
            const current = JSON.parse(raw)
            await env.KV.put(rateKey, JSON.stringify({
              count: current.count + 1,
              firstSendTime: current.firstSendTime,
              ip: clientIP
            }), { expirationTtl: 120 })
          } catch {}
        }
      }
      statusCode = 404
      await saveRequestLog({
        ip: clientIP,
        path: '/api/verify/password',
        method: 'POST',
        status: 404,
        email: email,
        userAgent: userAgent
      }, env)
      return errorResponse('邮箱未注册', 404, request)
    }

    await sendPasswordEmail(email, found.password, found.label, env)

    if (env.KV) {
      await env.KV.delete(rateKey)
    }

    await saveRequestLog({
      ip: clientIP,
      path: '/api/verify/password',
      method: 'POST',
      status: 200,
      email: email,
      userAgent: userAgent
    }, env)

    return jsonResponse({
      success: true,
      message: '密码已发送到您的邮箱'
    }, 200, request)

  } catch (error) {
    statusCode = 500
    await saveRequestLog({
      ip: clientIP,
      path: '/api/verify/password',
      method: 'POST',
      status: 500,
      email: email,
      userAgent: userAgent
    }, env)
    console.error('找回密码错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误: ' + errorMessage, 500, request)
  }
}

async function sendPasswordEmail(to: string, password: string, label: string, env: Env): Promise<void> {
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
        subject: '晏阳城市建设 - 密码找回',
        html: `
          <div style="font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 0;">
            <div style="background: linear-gradient(135deg, #3B82F6, #2563EB); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">晏阳城市建设</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 14px; font-weight: 400;">用方块构筑城市与轨道的梦想</p>
            </div>
            <div style="background: #ffffff; padding: 32px 28px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f0f0f0;">
              <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6; margin: 0 0 6px 0;">您好，</p>
              <p style="font-size: 15px; color: #333333; line-height: 1.8; margin: 0 0 24px 0;">您正在找回晏阳城市建设下载页的密码，以下是您的账号信息：</p>
              <div style="background: #f8faff; border: 2px dashed #dbeafe; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
                <p style="font-size: 13px; color: #888888; margin: 0 0 10px 0; letter-spacing: 2px;">密 码</p>
                <span style="font-size: 34px; font-weight: bold; color: #3B82F6; letter-spacing: 6px; background: #eff6ff; padding: 8px 32px; border-radius: 8px; font-family: 'Courier New', monospace;">${password}</span>
              </div>
              <p style="font-size: 14px; color: #888888; line-height: 1.8; margin: 0 0 8px 0;">如果这不是您本人的操作，请忽略此邮件，并向管理员说明。</p>
              <p style="font-size: 14px; color: #888888; line-height: 1.8; margin: 0 0 24px 0;">如果不再需要获取密码，请联系管理员关闭此功能。</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="font-size: 12px; color: #bbbbbb; text-align: center; margin: 0; letter-spacing: 1px;">Copyright 2025-2026 晏阳技术组</p>
            </div>
          </div>
        `
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
        subject: '晏阳城市建设 - 密码找回',
        html: `
          <div style="font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 0;">
            <div style="background: linear-gradient(135deg, #3B82F6, #2563EB); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">晏阳城市建设</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0 0; font-size: 14px; font-weight: 400;">用方块构筑城市与轨道的梦想</p>
            </div>
            <div style="background: #ffffff; padding: 32px 28px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f0f0f0;">
              <p style="font-size: 15px; color: #1a1a1a; line-height: 1.6; margin: 0 0 6px 0;">您好，</p>
              <p style="font-size: 15px; color: #333333; line-height: 1.8; margin: 0 0 24px 0;">您正在找回晏阳城市建设内群的密码，以下是您的账号信息：</p>
              <div style="background: #f8faff; border: 2px dashed #dbeafe; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
                <p style="font-size: 13px; color: #888888; margin: 0 0 10px 0; letter-spacing: 2px;">密 码</p>
                <span style="font-size: 34px; font-weight: bold; color: #3B82F6; letter-spacing: 6px; background: #eff6ff; padding: 8px 32px; border-radius: 8px; font-family: 'Courier New', monospace;">${password}</span>
              </div>
              <p style="font-size: 14px; color: #888888; line-height: 1.8; margin: 0 0 8px 0;">如果这不是您本人的操作，请忽略此邮件，并向管理员说明。</p>
              <p style="font-size: 14px; color: #888888; line-height: 1.8; margin: 0 0 24px 0;">如果不再需要获取密码，请联系管理员关闭此功能。</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="font-size: 12px; color: #bbbbbb; text-align: center; margin: 0; letter-spacing: 1px;">Copyright 2025-2026 晏阳技术组</p>
            </div>
          </div>
        `
      })
    })

    if (!sendRes.ok) {
      const error = await sendRes.text()
      throw new Error(`邮件发送失败: ${sendRes.status} ${error}`)
    }
    return
  }

  console.log(`[测试模式] 密码 ${password} 应该发送到 ${to}`)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) })
    }

    if (path === '/api/health') {
      return handleHealth(request)
    }

    if (path === '/api/verify' && request.method === 'POST') {
      return handleVerify(request, env)
    }

    if (path === '/api/verify/password' && request.method === 'POST') {
      return handleFindPassword(request, env)
    }

    if (path === '/api/modpacks') {
      return handleModpacks(request, env)
    }

    if (path === '/api/java') {
      return handleJava(request, env)
    }

    if (path === '/api/launchers') {
      return handleLaunchers(request, env)
    }

    if (path === '/api/website/info') {
      return handleWebsiteInfo(request)
    }

    if (path === '/api/download/one-time' && request.method === 'POST') {
      return handleOneTimeDownload(request, env)
    }

    if (path === '/api/download/redirect') {
      return handleRedirect(request, env)
    }

    if (path === '/api/download/proxy') {
      return handleProxyDownload(request, env)
    }

    if (path === '/api/map/proxy') {
      return handleMapProxy(request, env)
    }

    if (path === '/api/admin/login' && request.method === 'POST') {
      return handleAdminLogin(request, env)
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