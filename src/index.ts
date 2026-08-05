import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js'
import { getDownkey, getModpacks, getJava, getLaunchers, verifyPassword } from './services/github.js'
import { simpleJWT, verifySimpleJWT } from './services/jwt.js'
import { Env, PasswordEntry, DownloadItem } from './types'

const TOKEN_EXPIRY = 3600000 // 1 小时

// 发送记录（内存缓存，Worker 重启会重置）
// 结构：email -> { count, firstSendTime, ip }
const sendRecords = new Map<string, { count: number; firstSendTime: number; ip: string }>()
// IP 封禁记录：ip -> { banTime: number, reason: string }
const bannedIPs = new Map<string, { banTime: number; reason: string }>()
const BAN_DURATION = 24 * 60 * 60 * 1000 // 1 天封禁
const MAX_ATTEMPTS = 5 // 最大尝试次数
const RATE_LIMIT_WINDOW = 60000 // 60 秒

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

  // 检查 token 是否已被使用（使用 KV）
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
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }

    const token = auth.replace('Bearer ', '')
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
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
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
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
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
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
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
  try {
    // 获取客户端 IP
    const clientIP = request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        'unknown'

    // 检查 IP 是否被封禁
    const banned = bannedIPs.get(clientIP)
    if (banned) {
      const remaining = Math.ceil((banned.banTime + BAN_DURATION - Date.now()) / 1000)
      if (remaining > 0) {
        const hours = Math.ceil(remaining / 3600)
        const minutes = Math.ceil((remaining % 3600) / 60)
        const timeStr = hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
        return errorResponse(
            `您的 IP 已被暂时封禁（剩余 ${timeStr}），请联系管理员申诉解封\n管理员邮箱：feedback@yanyn.cn`,
            403,
            request
        )
      } else {
        // 封禁过期，移除记录
        bannedIPs.delete(clientIP)
      }
    }

    const { email, cap_token } = await request.json() as { email: string; cap_token: string }

    if (!email || !cap_token) {
      return errorResponse('参数不完整', 400, request)
    }

    const capValid = await verifyCap(cap_token)
    if (!capValid) {
      return errorResponse('人机验证失败', 400, request)
    }

    const now = Date.now()
    const record = sendRecords.get(email)

    // 检查发送限制
    if (record) {
      // 同一邮箱 60 秒内只能发一次
      if (now - record.firstSendTime < RATE_LIMIT_WINDOW) {
        const remaining = Math.ceil((RATE_LIMIT_WINDOW - (now - record.firstSendTime)) / 1000)
        return errorResponse(`请等待 ${remaining} 秒后再试`, 429, request)
      }

      // 连续 5 次失败 → 封禁 IP 1 天
      if (record.count >= MAX_ATTEMPTS) {
        bannedIPs.set(clientIP, {
          banTime: now,
          reason: '连续5次密码找回失败，触发安全防护机制'
        })
        return errorResponse(
            '您已被暂时封禁（1天），请联系管理员申诉解封\n管理员邮箱：feedback@yanyn.cn',
            403,
            request
        )
      }

      // 正常计数
      if (now - record.firstSendTime >= RATE_LIMIT_WINDOW) {
        // 超过 60 秒，重置计数
        sendRecords.set(email, { count: 1, firstSendTime: now, ip: clientIP })
      } else {
        // 60 秒内再次请求，计数 +1
        sendRecords.set(email, { count: record.count + 1, firstSendTime: record.firstSendTime, ip: clientIP })
      }
    } else {
      // 首次请求
      sendRecords.set(email, { count: 1, firstSendTime: now, ip: clientIP })
    }

    const data = await getDownkey(env)
    const passwords = data.passwords || []
    const found = passwords.find(p => p.email === email)

    if (!found) {
      // 邮箱不存在也算一次失败尝试
      return errorResponse('邮箱未注册', 404, request)
    }

    // 发送邮件到邮箱
    await sendPasswordEmail(email, found.password, found.label, env)

    // 发送成功后重置该邮箱的失败计数
    sendRecords.delete(email)

    return jsonResponse({
      success: true,
      message: '密码已发送到您的邮箱'
    }, 200, request)

  } catch (error) {
    console.error('找回密码错误:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return errorResponse('服务器错误: ' + errorMessage, 500, request)
  }
}

async function sendPasswordEmail(to: string, password: string, label: string, env: Env): Promise<void> {
  // 优先使用 Resend Token 发送邮件
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

  // 后备方案：使用 CloudMail API（如果配置了账号密码）
  if (env.CLOUDMAIL_EMAIL && env.CLOUDMAIL_PASSWORD) {
    // 登录 CloudMail 获取 token
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

    // 发送邮件
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

  // 如果都没有配置，记录日志但不报错（测试模式）
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

    return errorResponse('API Not Found', 404, request)
  }
}