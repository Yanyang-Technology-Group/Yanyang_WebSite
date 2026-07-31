export function corsHeaders(request) {
  const origin = request.headers.get('Origin') || ''
  const allowed = [
    'https://www.yanyn.cn',
    'https://yanyn.cn',
    'http://localhost:5173',
    'http://localhost:4173'
  ]

  const isAllowed = allowed.some(o => origin === o || origin.startsWith(o))

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://www.yanyn.cn',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  }
}

export function jsonResponse(data, status = 200, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json'
    }
  })
}

export function errorResponse(message, status = 400, request) {
  return jsonResponse({ success: false, message }, status, request)
}