export async function getData(env, filename) {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/${filename}`

  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!res.ok) {
    throw new Error('获取数据失败')
  }

  const data = await res.json()
  const binary = atob(data.content)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(bytes)
  return JSON.parse(text)
}

export async function getDownkey(env) {
  return getData(env, 'downkey.json')
}

export async function getModpacks(env) {
  return getData(env, 'modpack.json')
}

export async function getJava(env) {
  return getData(env, 'javajdk.json')
}

export async function getLaunchers(env) {
  return getData(env, 'launcher.json')
}

export async function getOneTimeTokens(env) {
  return getData(env, 'one_time_tokens.json')
}

export async function verifyPassword(password, env) {
  const data = await getDownkey(env)
  const passwords = data.passwords || []
  const found = passwords.find(p => p.password === password)
  return found || null
}

export async function saveOneTimeToken(env, tokenData) {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/one_time_tokens.json`

  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!res.ok) {
    throw new Error('获取token数据失败')
  }

  const data = await res.json()
  const binary = atob(data.content)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(bytes)
  const tokens = JSON.parse(text)
  tokens.tokens.push(tokenData)

  const updatedContent = btoa(JSON.stringify(tokens, null, 2))
  const sha = data.sha

  const updateRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      message: `添加一次性token: ${tokenData.token}`,
      content: updatedContent,
      sha: sha
    })
  })

  if (!updateRes.ok) {
    throw new Error('保存token失败')
  }

  return true
}