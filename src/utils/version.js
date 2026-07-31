// 版本号已经在构建时注入，直接使用即可
export function getVersion() {
  // 直接使用构建时注入的版本号
  return __VERSION__ || '未知版本'
}

// 如果需要获取提交次数
export function getCommitCount() {
  return __COMMIT_COUNT__ || '0'
}

// 异步版本（保持兼容）
export async function getVersionAsync() {
  return getVersion()
}

// 带缓存的版本
let cachedVersion = null

export function getVersionWithCache() {
  if (cachedVersion) {
    return Promise.resolve(cachedVersion)
  }

  const version = getVersion()
  cachedVersion = version
  return Promise.resolve(version)
}