import { Env, DownkeyData, ModpackData, JavaData, LauncherData } from '../types'

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