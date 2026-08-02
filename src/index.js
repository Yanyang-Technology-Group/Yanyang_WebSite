async function handleMapProxy(request, env) {
  try {
    const url = new URL(request.url)
    const target = url.searchParams.get('target')

    if (!target) {
      return new Response('缺少目标地址', { status: 400 })
    }

    const targetUrl = new URL(target)
    const host = targetUrl.host

    const response = await fetch(target, {
      headers: {
        'Host': host,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      cf: {
        cacheTtl: 0,
        cacheKey: target
      }
    })

    if (!response.ok) {
      return new Response(`地图服务响应错误: ${response.status}`, { status: response.status })
    }

    const content = await response.text()

    return new Response(content, {
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