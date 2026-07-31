// 获取 GitHub 提交次数
async function getCommitCount() {
  try {
    const response = await fetch(
      'https://api.github.com/repos/Yanyang-Technology-Group/Yanyang_WebSite/commits?per_page=1',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Yanyang-Website'
        }
      }
    )

    const linkHeader = response.headers.get('Link')
    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/)
      if (match) {
        return parseInt(match[1], 10)
      }
    }

    // 降级方案
    const commits = await response.json()
    if (Array.isArray(commits) && commits.length < 30) {
      return commits.length
    }

    return 0
  } catch (error) {
    console.error('获取提交次数失败:', error)
    return 0
  }
}

// 生成完整版本号（日期从构建时锁死，提交次数动态获取）
export async function getVersion() {
  // 从构建时注入的变量获取日期
  const buildDate = __BUILD_DATE__ ||
    (() => {
      const now = new Date()
      return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
    })()

  const commitCount = await getCommitCount()
  return `${buildDate}.${commitCount}`
}

// 缓存版本（页面生命周期内只请求一次）
let cachedVersion = null
let cachedPromise = null

export function getVersionWithCache() {
  if (cachedVersion) {
    return Promise.resolve(cachedVersion)
  }

  if (!cachedPromise) {
    cachedPromise = getVersion().then(version => {
      cachedVersion = version
      return version
    })
  }

  return cachedPromise
}