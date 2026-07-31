export async function getData(env) {
  const url = `https://api.github.com/repos/${env.REPO_OWNER}/${env.REPO_NAME}/contents/downloads.json`

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
  const content = atob(data.content)
  return JSON.parse(content)
}