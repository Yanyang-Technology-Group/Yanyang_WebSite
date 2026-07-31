export function getVersion() {
  return __VERSION__ || '未知版本'
}

export function getCommitCount() {
  return __COMMIT_COUNT__ || '0'
}

export function getBuildDate() {
  return __BUILD_DATE__ || ''
}

export function getBuildTime() {
  return __BUILD_TIME__ || ''
}

export function getBuilder() {
  return __BUILDER__ || ''
}

let cachedVersion = null

export function getVersionWithCache() {
  if (cachedVersion) {
    return Promise.resolve(cachedVersion)
  }

  const version = getVersion()
  cachedVersion = version
  return Promise.resolve(version)
}

async function getCommitCountFromGitHub() {
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

    return 0
  } catch {
    return 0
  }
}

export async function getVersionFromGitHub() {
  const buildDate = __BUILD_DATE__ || (() => {
    const now = new Date()
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  })()

  const commitCount = await getCommitCountFromGitHub()
  return `${buildDate}.${commitCount}`
}

let cachedVersionFromGitHub = null
let cachedPromise = null

export function getVersionFromGitHubWithCache() {
  if (cachedVersionFromGitHub) {
    return Promise.resolve(cachedVersionFromGitHub)
  }

  if (!cachedPromise) {
    cachedPromise = getVersionFromGitHub().then(version => {
      cachedVersionFromGitHub = version
      return version
    })
  }

  return cachedPromise
}