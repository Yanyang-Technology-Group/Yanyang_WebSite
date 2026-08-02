import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js'
import { getDownkey, getModpacks, getJava, getLaunchers, getOneTimeTokens, saveOneTimeToken, verifyPassword } from './services/github.js'
import { simpleJWT, verifySimpleJWT } from './services/jwt.js'

const TOKEN_EXPIRY = 3600000

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

    const oneTimeToken = generateOneTimeToken()
    const expiresAt = Date.now() + 600000

    await saveOneTimeToken(env, {
      token: oneTimeToken,
      linkId: linkId,
      used: false,
      expiresAt: expiresAt,
      createdAt: Date.now()
    })

    return jsonResponse({
      success: true,
      token: oneTimeToken,
      expiresIn: 600
    }, 200, request)

  } catch (error) {
    console.error('生成一次性链接错误:', error)
    return errorResponse('服务器错误', 500, request)
  }
}

async function handleGetDownloadLink(request, env) {
  try {
    const url = new URL(request.url)
    const oneTimeToken = url.searchParams.get('token')
    if (!oneTimeToken) {
      return errorResponse('缺少token', 400, request)
    }

    const tokensData = await getOneTimeTokens(env)
    const tokenData = tokensData.tokens.find(t => t.token === oneTimeToken)

    if (!tokenData) {
      return errorResponse('链接无效', 404, request)
    }

    if (tokenData.used) {
      return errorResponse('链接已被使用', 410, request)
    }

    if (tokenData.expiresAt < Date.now()) {
      return errorResponse('链接已过期', 404, request)
    }

    const modpacks = await getModpacks(env)
    const java = await getJava(env)
    const launchers = await getLaunchers(env)
    const allItems = [...(modpacks.items || []), ...(java.items || []), ...(launchers.items || [])]

    let targetLink = null
    for (const item of allItems) {
      if (item.downloads) {
        const found = item.downloads.find(d => d.name === tokenData.linkId)
        if (found) {
          targetLink = found.link
          break
        }
      }
      if (item.link && item.name === tokenData.linkId) {
        targetLink = item.link
        break
      }
    }

    if (!targetLink) {
      return errorResponse('链接不存在', 404, request)
    }

    tokenData.used = true
    await saveOneTimeToken(env, tokenData)

    return jsonResponse({
      success: true,
      link: targetLink
    }, 200, request)

  } catch (error) {
    console.error('获取下载链接错误:', error)
    return errorResponse('服务器错误', 500, request)
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

    if (path === '/api/download/link') {
      return handleGetDownloadLink(request, env)
    }

    return errorResponse('API Not Found', 404, request)
  }
}