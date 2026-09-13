export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.www.yanyn.cn'

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/api/health`,
  adminLogin: `${API_BASE_URL}/api/admin/login`,
  adminBanned: `${API_BASE_URL}/api/admin/banned`,
  adminUnban: `${API_BASE_URL}/api/admin/unban`,
  adminUpdateBan: `${API_BASE_URL}/api/admin/update-ban`,
  adminLogs: `${API_BASE_URL}/api/admin/logs`,
  adminLogsClear: `${API_BASE_URL}/api/admin/logs/clear`,
}