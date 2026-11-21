import { writeFile } from 'node:fs/promises'

const source = 'https://www.cloudflarestatus.com/services'
const response = await fetch(source, { signal: AbortSignal.timeout(20000), redirect: 'error' })
if (!response.ok) throw new Error(`Cloudflare status HTTP ${response.status}`)
const html = await response.text()
const marker = 'streamController.enqueue('
const offset = html.indexOf(marker)
if (offset < 0) throw new Error('Cloudflare status loader not found')
const start = offset + marker.length
let end = start + 1
while (end < html.length) {
  if (html[end] === '\\') { end += 2; continue }
  if (html[end] === '"') break
  end++
}
const flat = JSON.parse(JSON.parse(html.slice(start, end + 1)))
const decoded = new Map()
function decode(index) {
  if (index < 0) return null
  if (decoded.has(index)) return decoded.get(index)
  const value = flat[index]
  if (value === null || typeof value !== 'object') return value
  const result = Array.isArray(value) ? [] : Object.create(null)
  decoded.set(index, result)
  if (Array.isArray(value)) for (const item of value) result.push(decode(item))
  else for (const [key, item] of Object.entries(value)) result[decode(Number(key.slice(1)))] = decode(item)
  return result
}
const data = decode(0).loaderData['routes/services']
const services = data.components.components.filter(item => item.type === 'service')
const groups = data.components.component_groups.filter(item => item.type === 'service')
if (!services.length || !groups.length || !data.timeline.startDate || !Array.isArray(data.timeline.incidents)) throw new Error('Invalid status snapshot')
const snapshot = { source, capturedAt: new Date().toISOString(),
  components: { components: services, component_groups: groups },
  timeline: { ...data.timeline, byComponent: Object.fromEntries(services.filter(item => data.timeline.byComponent[item.id]).map(item => [item.id, data.timeline.byComponent[item.id]])) },
}
await writeFile(new URL('../src/data/cloudflare-status.snapshot.json', import.meta.url), JSON.stringify(snapshot) + '\n')
console.log(`Saved ${services.length} services, ${groups.length} groups, and 90 days of incident history from ${source}`)
