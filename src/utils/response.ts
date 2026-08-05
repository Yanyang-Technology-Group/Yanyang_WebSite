export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || ''
  const allowed = [
    'https://www.yanyn.cn',
    'https://yanyn.cn',
    'http://localhost:5173',
    'http://localhost:4173'
  ]

  const isAllowed = allowed.includes(origin)

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://www.yanyn.cn',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  }
}

export function jsonResponse<T>(data: T, status: number = 200, request: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

export function errorResponse(message: string, status: number = 400, request: Request): Response {
  return jsonResponse({ success: false, message }, status, request)
}
