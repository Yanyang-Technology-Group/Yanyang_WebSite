import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { readMonitoringCache } from './monitoring-cache'

interface StatusComponent { id: string; type: string }
interface StatusSnapshot {
  source: string; capturedAt: string
  components: { component_groups: Array<{ type: string }>; components: StatusComponent[] }
  timeline: { startDate: string; incidents: string[][]; byComponent: Record<string, unknown> }
}

// Cloudflare's services page publishes its complete structured loader data in the
// server-rendered HTML. Decode its flattened references without executing scripts.
export function parseStatusPage(html: string): Omit<StatusSnapshot, 'source' | 'capturedAt'> {
  const marker = 'streamController.enqueue('
  const offset = html.indexOf(marker)
  if (offset < 0) throw new Error('status_format_unavailable')
  const start = offset + marker.length
  if (html[start] !== '"') throw new Error('status_format_unavailable')
  let end = start + 1
  while (end < html.length) {
    if (html[end] === '\\') { end += 2; continue }
    if (html[end] === '"') break
    end++
  }
  const flat = JSON.parse(JSON.parse(html.slice(start, end + 1)) as string) as unknown[]
  const decoded = new Map<number, unknown>()
  const decode = (index: number): unknown => {
    if (index < 0) return null
    if (decoded.has(index)) return decoded.get(index)
    const value = flat[index]
    if (value === null || typeof value !== 'object') return value
    if (Array.isArray(value)) {
      const result: unknown[] = []
      decoded.set(index, result)
      for (const item of value) result.push(decode(item as number))
      return result
    }
    const result = Object.create(null) as Record<string, unknown>
    decoded.set(index, result)
    for (const [key, item] of Object.entries(value)) result[String(decode(Number(key.slice(1))))] = decode(item as number)
    return result
  }
  const root = decode(0) as { loaderData?: Record<string, Omit<StatusSnapshot, 'source' | 'capturedAt'>> }
  const data = root.loaderData?.['routes/services']
  if (!data || !Array.isArray(data.components?.components) || !Array.isArray(data.timeline?.incidents) || !/^\d{4}-\d{2}-\d{2}$/.test(data.timeline.startDate)) {
    throw new Error('status_format_unavailable')
  }
  const services = data.components.components.filter(item => item.type === 'service')
  if (!services.length) throw new Error('status_format_unavailable')
  return {
    components: { component_groups: data.components.component_groups.filter(item => item.type === 'service'), components: services },
    timeline: { ...data.timeline, byComponent: Object.fromEntries(services.filter(item => data.timeline.byComponent[item.id]).map(item => [item.id, data.timeline.byComponent[item.id]])) },
  }
}

export async function handleCloudflareStatus(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') return errorResponse('Method not allowed', 405, request)
  if (new URL(request.url).search) return errorResponse('Query parameters are not supported', 400, request)
  try {
    const result = await readMonitoringCache(env, 'cloudflare-services:v1', async (): Promise<StatusSnapshot> => {
      const response = await fetch('https://www.cloudflarestatus.com/services', { redirect: 'error', signal: AbortSignal.timeout(15_000) })
      if (!response.ok) throw new Error('status_unavailable')
      const html = await response.text()
      if (html.length > 2_000_000) throw new Error('status_unavailable')
      return { ...parseStatusPage(html), source: 'https://www.cloudflarestatus.com/services', capturedAt: new Date().toISOString() }
    })
    return jsonResponse({ success: true, ...result }, 200, request)
  } catch {
    return jsonResponse({ success: false, code: 'status_unavailable' }, 503, request)
  }
}
