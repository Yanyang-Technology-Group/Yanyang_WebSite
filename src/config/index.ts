export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.www.yanyn.cn'

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  verify: `${API_BASE_URL}/api/verify`,
  verifyPassword: `${API_BASE_URL}/api/verify/password`,
  modpacks: `${API_BASE_URL}/api/modpacks`,
  java: `${API_BASE_URL}/api/java`,
  launchers: `${API_BASE_URL}/api/launchers`,
  oneTime: `${API_BASE_URL}/api/download/one-time`,
  adminLogin: `${API_BASE_URL}/api/admin/login`,
  adminBanned: `${API_BASE_URL}/api/admin/banned`,
  adminUnban: `${API_BASE_URL}/api/admin/unban`,
  adminUpdateBan: `${API_BASE_URL}/api/admin/update-ban`,
  adminLogs: `${API_BASE_URL}/api/admin/logs`,
  adminLogsClear: `${API_BASE_URL}/api/admin/logs/clear`,
}

export const TOKEN_KEY = 'download_token'
export const TOKEN_EXPIRY = 3600