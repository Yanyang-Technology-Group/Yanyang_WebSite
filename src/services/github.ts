import { Env, DownkeyData, ModpackData, JavaData, LauncherData, PanelConfig } from '../types'

async function getData<T>(env: Env, filename: string): Promise<T> {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${filename}`

  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!res.ok) {
    throw new Error(`GitHub API 失败: ${res.status} ${res.statusText} (${filename})`)
  }

  const data: any = await res.json()
  const binary = atob(data.content)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(bytes)
  return JSON.parse(text)
}

export async function getDownkey(env: Env): Promise<DownkeyData> {
  return getData<DownkeyData>(env, 'downkey.json')
}

export async function getModpacks(env: Env): Promise<ModpackData> {
  return getData<ModpackData>(env, 'modpack.json')
}

export async function getJava(env: Env): Promise<JavaData> {
  return getData<JavaData>(env, 'javajdk.json')
}

export async function getLaunchers(env: Env): Promise<LauncherData> {
  return getData<LauncherData>(env, 'launcher.json')
}

export async function verifyPassword(password: string, env: Env): Promise<any> {
  const data = await getDownkey(env)
  const passwords = data.passwords || []
  const found = passwords.find(p => p.password === password)
  return found || null
}

// panel.json 凭据几乎不变，缓存 10 分钟，避免服务器状态页每次刷新都打 GitHub API
let cachedPanelConfig: { config: PanelConfig | null; expiresAt: number } | null = null

export async function getPanelConfig(env: Env): Promise<PanelConfig | null> {
  if (cachedPanelConfig && Date.now() < cachedPanelConfig.expiresAt) {
    return cachedPanelConfig.config
  }
  try {
    const config = await getData<PanelConfig>(env, 'panel.json')
    cachedPanelConfig = { config, expiresAt: Date.now() + 10 * 60 * 1000 }
    return config
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      cachedPanelConfig = { config: null, expiresAt: Date.now() + 10 * 60 * 1000 }
      return null
    }
    throw error
  }
}
