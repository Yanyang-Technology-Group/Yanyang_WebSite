export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend.www.yanyn.cn'

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  verify: `${API_BASE_URL}/api/verify`,
  downloads: `${API_BASE_URL}/api/downloads`,
  website: `${API_BASE_URL}/api/website/info`,
}

export const TOKEN_KEY = 'yanyang_download_token'