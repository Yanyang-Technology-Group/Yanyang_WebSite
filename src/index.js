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

    if (password.length !== 6 || !/^\d{6}$/.test(password)) {
      return errorResponse('密码必须为6位数字', 400, request)
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
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    })

    let html = await response.text()

    const baseUrl = target.replace(/\/$/, '')
    html = html.replace(/(src|href)=["'](?!https?:\/\/)(\/?[^"']*)["']/g, (match, attr, path) => {
      const absoluteUrl = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`
      return `${attr}="${absoluteUrl}"`
    })

    return new Response(html, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('地图代理错误:', error)
    return new Response('地图加载失败', { status: 500 })
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

    return errorResponse('API Not Found', 404, request)
  }
}