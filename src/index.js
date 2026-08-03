import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js'
import { getDownkey, getModpacks, getJava, getLaunchers, verifyPassword } from './services/github.js'
import { simpleJWT, verifySimpleJWT } from './services/jwt.js'

const TOKEN_EXPIRY = 3600000
const ONE_TIME_SECRET = 'yanyang-one-time-secret-2026'
const usedTokens = new Set()

function filterByType(items, passwordType) {
  if (passwordType === 'full') {
    return items
  }
  if (passwordType === 'public') {
    return items.filter(item => item.public === true)
  }
  return items
}

function generateOneTimeToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

function signLink(link, token) {
  const signature = btoa(`${link}|${token}|${ONE_TIME_SECRET}`)
  return {
    token: token,
    signature: signature
  }
}

function verifySignedLink(link, token, signature) {
  const expected = btoa(`${link}|${token}|${ONE_TIME_SECRET}`)
  if (signature !== expected) {
    return { valid: false, reason: '签名无效' }
  }
  if (usedTokens.has(token)) {
    return { valid: false, reason: '链接已被使用' }
  }
  return { valid: true }
}

async function handleHealth(request) {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'yanyang-backend',
    domain: 'backend.www.yanyn.cn',
    version: '1.0.0'
  }, 200, request)
}

async function handleVerify(request, env) {
  try {
    console.log('=== 开始验证 ===')
    console.log('GITHUB_TOKEN 是否存在:', !!env.GITHUB_TOKEN)
    console.log('REPO_OWNER:', env.REPO_OWNER)
    console.log('REPO_NAME:', env.REPO_NAME)

    const { password } = await request.json()
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
    const token = simpleJWT({
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
    console.error('验证错误:', error.message)
    console.error('错误堆栈:', error.stack)
    return errorResponse('服务器错误，请稍后重试', 500, request)
  }
}

async function handleOneTimeDownload(request, env) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }

    const token = auth.replace('Bearer ', '')
    const decoded = verifySimpleJWT(token, env.JWT_SECRET)
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

    let targetLink = null
    for (const item of allItems) {
      if (item.downloads) {
        const found = item.downloads.find(d => d.name === linkId)
        if (found) {
          targetLink = found.link
          break
        }
      }
      if (item.link && item.name === linkId) {
        targetLink = item.link
        break
      }
    }

    if (!targetLink) {
      return errorResponse('链接不存在', 404, request)
    }

    const oneTimeToken = generateOneTimeToken()
    const signed = signLink(targetLink, oneTimeToken)

    return jsonResponse({
      success: true,
      token: oneTimeToken,
      signature: signed.signature
    }, 200, request)

  } catch (error) {
    console.error('生成一次性链接错误:', error)
    return errorResponse('服务器错误', 500, request)
  }
}

async function handleRedirect(request, env) {
  try {
    const url = new URL(request.url)
    const link = url.searchParams.get('link')
    const token = url.searchParams.get('token')
    const sig = url.searchParams.get('sig')

    if (!link || !token || !sig) {
      return new Response('链接参数不完整', { status: 400 })
    }

    const result = verifySignedLink(link, token, sig)

    if (!result.valid) {
      return new Response(result.reason, { status: 403 })
    }

    usedTokens.add(token)

    return Response.redirect(link, 302)

  } catch (error) {
    console.error('重定向错误:', error)
    return new Response('服务器错误', { status: 500 })
  }
}

async function handleProxyDownload(request, env) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const sig = url.searchParams.get('sig')
    const link = url.searchParams.get('link')
    const filename = url.searchParams.get('filename') || 'download'

    if (!token || !sig || !link) {
      return new Response('参数不完整', { status: 400 })
    }

    const result = verifySignedLink(link, token, sig)

    if (!result.valid) {
      return new Response(result.reason, { status: 403 })
    }

    usedTokens.add(token)

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
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('代理下载错误:', error)
    return new Response('服务器错误', { status: 500 })
  }
}

async function handleMapProxy(request, env) {
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
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('地图代理错误:', error)
    return new Response('地图加载失败: ' + error.message, { status: 500 })
  }
}

async function handleModpacks(request, env) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = verifySimpleJWT(token, env.JWT_SECRET)
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
    return errorResponse('服务器错误', 500, request)
  }
}

async function handleJava(request, env) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = verifySimpleJWT(token, env.JWT_SECRET)
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
    return errorResponse('服务器错误', 500, request)
  }
}

async function handleLaunchers(request, env) {
  try {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return errorResponse('未授权', 401, request)
    }
    const token = auth.replace('Bearer ', '')
    const decoded = verifySimpleJWT(token, env.JWT_SECRET)
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
    return errorResponse('服务器错误', 500, request)
  }
}

async function handleWebsiteInfo(request) {
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

// ========== 找回密码相关 ==========

async function handleFindPassword(request, env) {
  try {
    const { email, turnstile_token } = await request.json()

    if (!email || !turnstile_token) {
      return errorResponse('参数不完整', 400, request)
    }

    // 验证 Turnstile
    const turnstileValid = await verifyTurnstile(turnstile_token, env.TURNSTILE_SECRET_KEY)
    if (!turnstileValid) {
      return errorResponse('人机验证失败', 400, request)
    }

    // 从 downkey.json 查找邮箱
    const data = await getDownkey(env)
    const passwords = data.passwords || []
    const found = passwords.find(p => p.email === email)

    if (!found) {
      return errorResponse('邮箱未注册', 404, request)
    }

    // 生成6位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 60000

    // 存入 KV
    await env.YANYANG_DATA.put(`reset_code:${email}`, JSON.stringify({
      code,
      expiresAt,
      password: found.password,
      type: found.type,
      label: found.label
    }), { expirationTtl: 120 })

    // 通过 CloudMail 发送邮件
    await sendEmailViaCloudMail(email, code, env)

    return jsonResponse({
      success: true,
      message: '验证码已发送到您的邮箱'
    }, 200, request)

  } catch (error) {
    console.error('找回密码错误:', error)
    return errorResponse('服务器错误，请稍后重试', 500, request)
  }
}

async function handleResetPassword(request, env) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return errorResponse('参数不完整', 400, request)
    }

    if (newPassword.length < 1 || newPassword.length > 20 || !/^[a-zA-Z0-9]+$/.test(newPassword)) {
      return errorResponse('密码格式错误（仅限英文和数字，1-20位）', 400, request)
    }

    const data = await env.YANYANG_DATA.get(`reset_code:${email}`, 'json')
    if (!data) {
      return errorResponse('验证码已过期，请重新获取', 400, request)
    }

    if (data.code !== code) {
      return errorResponse('验证码错误', 400, request)
    }

    if (Date.now() > data.expiresAt) {
      await env.YANYANG_DATA.delete(`reset_code:${email}`)
      return errorResponse('验证码已过期，请重新获取', 400, request)
    }

    await updatePasswordInGitHub(email, newPassword, env)
    await env.YANYANG_DATA.delete(`reset_code:${email}`)

    return jsonResponse({
      success: true,
      message: '密码重置成功'
    }, 200, request)

  } catch (error) {
    console.error('重置密码错误:', error)
    return errorResponse('服务器错误，请稍后重试', 500, request)
  }
}

async function verifyTurnstile(token, secretKey) {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      })
    })
    const data = await response.json()
    return data.success === true
  } catch {
    return false
  }
}

async function sendEmailViaCloudMail(to, code, env) {
  const cloudMailApi = env.CLOUDMAIL_API || 'https://cloudmail.yanyn.cn/api/send'

  await fetch(cloudMailApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.CLOUDMAIL_TOKEN}`
    },
    body: JSON.stringify({
      to: to,
      subject: '晏阳城市建设 - 密码重置验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: #3B82F6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">晏阳城市建设</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333;">您好，</p>
            <p style="font-size: 16px; color: #333;">您正在重置晏阳城市建设下载页的密码。请使用以下验证码：</p>
            <div style="text-align: center; padding: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; background: #f0f4ff; padding: 10px 30px; border-radius: 8px;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #888;">验证码有效期为 <strong>60秒</strong>，请尽快使用。</p>
            <p style="font-size: 14px; color: #888;">如果这不是您本人的操作，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">晏阳城市建设 · 用方块构筑城市与轨道的梦想</p>
          </div>
        </div>
      `
    })
  })
}

async function updatePasswordInGitHub(email, newPassword, env) {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/downkey.json`

  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!res.ok) {
    throw new Error('获取文件失败')
  }

  const data = await res.json()
  const binary = atob(data.content)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(bytes)
  const downkey = JSON.parse(text)

  const passwords = downkey.passwords || []
  const found = passwords.find(p => p.email === email)
  if (found) {
    found.password = newPassword
  }

  const updatedContent = btoa(JSON.stringify(downkey, null, 2))

  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `更新密码: ${email}`,
      content: updatedContent,
      sha: data.sha
    })
  })
}

export default {
  async fetch(request, env) {
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

    if (path === '/api/find-password' && request.method === 'POST') {
      return handleFindPassword(request, env)
    }

    if (path === '/api/reset-password' && request.method === 'POST') {
      return handleResetPassword(request, env)
    }

    return errorResponse('API Not Found', 404, request)
  }
}