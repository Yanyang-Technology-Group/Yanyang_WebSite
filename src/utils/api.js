// utils/api.js
import { removeToken } from './cookie'

export async function fetchWithAuth(endpoint, token, options = {}) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            if (response.status === 401) {
                removeToken()
                return { success: false, status: 401, message: '认证已过期，请重新登录' }
            }
            try {
                const errorData = await response.json()
                return { success: false, status: response.status, message: errorData.message || `请求失败 (${response.status})` }
            } catch {
                return { success: false, status: response.status, message: `请求失败 (${response.status})` }
            }
        }

        const data = await response.json()
        return { success: true, ...data }
    } catch (error) {
        return { success: false, status: 0, message: '网络错误，请检查网络连接后重试' }
    }
}
