import { Env, PanelConfig, ServerStats } from '../types'
import { getPanelConfig } from './github.js'

export class PanelNotConfiguredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PanelNotConfiguredError'
  }
}

interface PanelDiskInfo {
  path?: string
  total?: number
  free?: number
  used?: number
  usedPercent?: number
}

interface PanelCurrentInfo {
  uptime?: number
  load1?: number
  load5?: number
  load15?: number
  cpuUsedPercent?: number
  cpuTotal?: number
  memoryTotal?: number
  memoryAvailable?: number
  memoryUsed?: number
  memoryUsedPercent?: number
  diskData?: PanelDiskInfo[]
  shotTime?: string
}

interface PanelBaseInfo {
  hostname?: string
  platform?: string
  platformVersion?: string
  kernelArch?: string
  cpuLogicalCores?: number
  cpuModelName?: string
}

interface PanelLoginResponse {
  code?: number
  message?: string
  data?: {
    name?: string
    token?: string
    mfaStatus?: string
  }
}

// 1Panel JWT 有效期约 1 小时，这里缓存 25 分钟，避免每个请求都登录
let cachedToken: { token: string; expiresAt: number } | null = null
// 面板数据短缓存，降低面板压力
let cachedStats: { stats: ServerStats; expiresAt: number } | null = null

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ---- RSA PKCS#1 v1.5（Cloudflare Workers 的 WebCrypto 不提供 RSAES-PKCS1-v1_5，这里用 BigInt 实现） ----

function derReadLength(data: Uint8Array, offset: number): { length: number; next: number } {
  const first = data[offset]
  if ((first & 0x80) === 0) {
    return { length: first, next: offset + 1 }
  }
  const count = first & 0x7f
  let length = 0
  for (let i = 0; i < count; i++) {
    length = length * 256 + data[offset + 1 + i]
  }
  return { length, next: offset + 1 + count }
}

function parseSpiPublicKey(der: Uint8Array): { n: bigint; e: bigint } {
  let offset = 0
  if (der[offset] !== 0x30) throw new Error('公钥格式无效')
  const outer = derReadLength(der, offset + 1)
  offset = outer.next

  if (der[offset] !== 0x30) throw new Error('公钥格式无效')
  const alg = derReadLength(der, offset + 1)
  offset = alg.next + alg.length

  if (der[offset] !== 0x03) throw new Error('公钥格式无效')
  const bitString = derReadLength(der, offset + 1)
  const innerStart = bitString.next + 1
  if (der[innerStart] !== 0x30) throw new Error('公钥格式无效')
  const inner = derReadLength(der, innerStart + 1)

  let p = inner.next
  if (der[p] !== 0x02) throw new Error('公钥格式无效')
  const nLen = derReadLength(der, p + 1)
  const nBytes = der.slice(nLen.next, nLen.next + nLen.length)

  p = nLen.next + nLen.length
  if (der[p] !== 0x02) throw new Error('公钥格式无效')
  const eLen = derReadLength(der, p + 1)
  const eBytes = der.slice(eLen.next, eLen.next + eLen.length)

  let n = 0n
  for (const b of nBytes) n = (n << 8n) | BigInt(b)
  let e = 0n
  for (const b of eBytes) e = (e << 8n) | BigInt(b)
  return { n, e }
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n
  let b = base % mod
  let e = exp
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod
    b = (b * b) % mod
    e >>= 1n
  }
  return result
}

function rsaPkcs1V15Encrypt(data: Uint8Array, n: bigint, e: bigint): Uint8Array {
  let k = 0
  let t = n
  while (t > 0n) {
    t >>= 8n
    k++
  }
  const psLen = k - data.length - 3
  if (psLen < 8) {
    throw new Error('RSA 加密数据过长')
  }

  const em = new Uint8Array(k)
  em[0] = 0x00
  em[1] = 0x02
  const randomBytes = crypto.getRandomValues(new Uint8Array(psLen))
  for (let i = 0; i < psLen; i++) {
    let b = randomBytes[i]
    while (b === 0) {
      b = crypto.getRandomValues(new Uint8Array(1))[0]
    }
    em[2 + i] = b
  }
  em[2 + psLen] = 0x00
  em.set(data, 2 + psLen + 1)

  let m = 0n
  for (const b of em) m = (m << 8n) | BigInt(b)
  let c = modPow(m, e, n)

  const out = new Uint8Array(k)
  for (let i = k - 1; i >= 0; i--) {
    out[i] = Number(c & 0xffn)
    c >>= 8n
  }
  return out
}

function rsaEncrypt(data: string, publicKeyPem: string): string {
  const pem = publicKeyPem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')
  const der = base64ToBytes(pem)
  const { n, e } = parseSpiPublicKey(der)
  const encrypted = rsaPkcs1V15Encrypt(new TextEncoder().encode(data), n, e)
  return bytesToBase64(encrypted)
}

async function aesEncrypt(plaintext: string, keyHex: string, iv: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(keyHex),
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  )
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  return bytesToBase64(new Uint8Array(encrypted))
}

// 与 1Panel 前端 encryptPassword 保持一致的加密：RSA(AES_KEY):IV:CIPHER
async function encryptPanelPassword(password: string, publicKeyPem: string): Promise<string> {
  const keyBytes = new Uint8Array(16)
  crypto.getRandomValues(keyBytes)
  const aesKeyHex = Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const iv = new Uint8Array(16)
  crypto.getRandomValues(iv)

  const keyCipher = rsaEncrypt(aesKeyHex, publicKeyPem)
  const passwordCipher = await aesEncrypt(password, aesKeyHex, iv)
  return `${keyCipher}:${bytesToBase64(iv)}:${passwordCipher}`
}

async function panelLogin(config: PanelConfig): Promise<string> {
  const base = `${config.address}/api/v1`

  // 1Panel 全局中间件会在任意响应里下发 panel_public_key Cookie
  const probe = await fetch(`${base}/auth/setting`, {
    headers: { 'User-Agent': 'yanyang-backend' }
  })
  if (!probe.ok) {
    throw new Error(`无法访问 1Panel（HTTP ${probe.status}），请检查 address 是否可公网访问`)
  }
  const cookieHeader = probe.headers.get('Set-Cookie') || ''
  const cookieMatch = cookieHeader.match(/panel_public_key=([^;]+)/)
  if (!cookieMatch) {
    throw new Error('未从 1Panel 获取到公钥，请确认面板版本为 1.x 且开启了登录鉴权')
  }
  const publicKeyPem = atob(decodeURIComponent(cookieMatch[1].replace(/\+/g, ' ')).replace(/"/g, ''))

  const password = await encryptPanelPassword(config.password, publicKeyPem)

  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'yanyang-backend',
      EntranceCode: bytesToBase64(new TextEncoder().encode(config.entrance || ''))
    },
    body: JSON.stringify({
      name: config.username,
      password,
      captcha: '',
      captchaID: '',
      authMethod: 'jwt',
      language: 'zh'
    })
  })
  const body = await loginRes.json() as PanelLoginResponse

  if (body.code !== 200) {
    const hint = body.message === 'ErrCaptchaCode'
      ? '面板要求输入验证码（登录失败次数过多触发），请稍后再试或在面板关闭验证码'
      : body.message === 'ErrAuth'
        ? '用户名或密码错误'
        : body.message || `错误码 ${body.code}`
    throw new Error(`1Panel 登录失败：${hint}`)
  }
  if (body.data?.mfaStatus === 'enable') {
    throw new Error('1Panel 开启了两步验证（MFA），请为网站关闭 MFA 或改用其他方式')
  }
  if (!body.data?.token) {
    throw new Error('1Panel 登录失败：未获取到 token')
  }
  return body.data.token
}

// 1Panel 实时数据（CPU/内存/磁盘）在 /dashboard/current（scope=basic）返回；
// /dashboard/base 只返回主机信息与 io/net 曲线，没有 CPU/内存/磁盘占用
async function fetchPanelCurrentInfo(config: PanelConfig, token: string): Promise<PanelCurrentInfo> {
  const res = await fetch(`${config.address}/api/v1/dashboard/current`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'yanyang-backend',
      PanelAuthorization: token
    },
    body: JSON.stringify({ scope: 'basic' })
  })
  const body = await res.json() as { code?: number; message?: string; data?: PanelCurrentInfo }
  if (body.code !== 200 || !body.data) {
    throw new Error(`获取 1Panel 实时数据失败：${body.message || body.code}`)
  }
  return body.data
}

async function fetchPanelBaseInfo(config: PanelConfig, token: string): Promise<PanelBaseInfo> {
  const res = await fetch(`${config.address}/api/v1/dashboard/base/all/all`, {
    headers: {
      'User-Agent': 'yanyang-backend',
      PanelAuthorization: token
    }
  })
  const body = await res.json() as { code?: number; message?: string; data?: PanelBaseInfo }
  if (body.code !== 200 || !body.data) {
    throw new Error(`获取 1Panel 主机信息失败：${body.message || body.code}`)
  }
  return body.data
}

function mapDashboardToStats(base: PanelBaseInfo, current: PanelCurrentInfo): ServerStats {
  const diskData = current.diskData || []
  const disk = diskData.find(d => d.path === '/') || diskData[0] || null
  return {
    timestamp: current.shotTime,
    hostname: base.hostname,
    platform: [base.platform, base.platformVersion, base.kernelArch]
      .filter(Boolean)
      .join(' '),
    uptime: current.uptime,
    load: [current.load1, current.load5, current.load15]
      .filter((v): v is number => typeof v === 'number'),
    cpu: {
      cores: base.cpuLogicalCores,
      model: base.cpuModelName,
      usagePercent: current.cpuUsedPercent
    },
    memory: {
      total: current.memoryTotal,
      used: current.memoryUsed,
      percent: current.memoryUsedPercent
    },
    disk: disk
      ? { total: disk.total, used: disk.used, percent: disk.usedPercent }
      : null
  }
}

export async function getServerStats(env: Env): Promise<ServerStats> {
  const config = await getPanelConfig(env)
  if (!config) {
    throw new PanelNotConfiguredError('未在私有仓库找到 panel.json，请联系管理员配置 1Panel 信息')
  }
  if (!config.address) {
    throw new PanelNotConfiguredError('panel.json 缺少 address 字段')
  }

  if (!cachedToken || Date.now() > cachedToken.expiresAt) {
    cachedToken = { token: await panelLogin(config), expiresAt: Date.now() + 25 * 60 * 1000 }
  }

  if (cachedStats && Date.now() < cachedStats.expiresAt) {
    return cachedStats.stats
  }

  try {
    const [base, current] = await Promise.all([
      fetchPanelBaseInfo(config, cachedToken.token),
      fetchPanelCurrentInfo(config, cachedToken.token)
    ])
    const stats = mapDashboardToStats(base, current)
    cachedStats = { stats, expiresAt: Date.now() + 5000 }
    return stats
  } catch (error) {
    // token 失效时重新登录重试一次
    if (error instanceof Error && /401|未授权|token/i.test(error.message)) {
      cachedToken = { token: await panelLogin(config), expiresAt: Date.now() + 25 * 60 * 1000 }
      const [base, current] = await Promise.all([
        fetchPanelBaseInfo(config, cachedToken.token),
        fetchPanelCurrentInfo(config, cachedToken.token)
      ])
      const stats = mapDashboardToStats(base, current)
      cachedStats = { stats, expiresAt: Date.now() + 5000 }
      return stats
    }
    throw error
  }
}
