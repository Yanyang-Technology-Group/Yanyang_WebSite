import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js'
import { getData } from './services/github.js'
import { simpleJWT, verifySimpleJWT } from './services/jwt.js'

const TOKEN_EXPIRY = 3600000

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
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return errorResponse('请提供密码', 400, request)
    }

    if (password.length !== 6 || !/^\d{6}$/.test(password)) {
      return errorResponse('密码必须为6位数字', 400, request)
    }

    const data = await getData(env)

    if (password === data.password) {
      const token = simpleJWT({
        verified: true,
        exp: Date.now() + TOKEN_EXPIRY,
        iat: Date.now()
      }, env.JWT_SECRET)

      return jsonResponse({
        success: true,
        token: token,
        downloads: data.downloads || []
      }, 200, request)
    }

    return errorResponse('密码错误', 401, request)

  } catch (error) {
    console.error('验证错误:', error)
    return errorResponse('服务器错误，请稍后重试', 500, request)
  }
}

async function handleDownloads(request, env) {
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

    const data = await getData(env)

    return jsonResponse({
      success: true,
      downloads: data.downloads || []
    }, 200, request)

  } catch (error) {
    console.error('获取下载列表错误:', error)
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

    if (path === '/api/downloads') {
      return handleDownloads(request, env)
    }

    if (path === '/api/website/info') {
      return handleWebsiteInfo(request)
    }

    return errorResponse('API Not Found', 404, request)
  }
}