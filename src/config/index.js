export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.www.yanyn.cn'

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  verify: `${API_BASE_URL}/api/verify`,
  verifyPassword: `${API_BASE_URL}/api/verify/password`,
  modpacks: `${API_BASE_URL}/api/modpacks`,
  java: `${API_BASE_URL}/api/java`,
  launchers: `${API_BASE_URL}/api/launchers`,
  oneTime: `${API_BASE_URL}/api/download/one-time`,
}

export const TOKEN_KEY = 'download_token'
export const TOKEN_EXPIRY = 3600 // 1 小时