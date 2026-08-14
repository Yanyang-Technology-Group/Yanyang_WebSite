// utils/api.ts
import { removeToken } from './cookie'

export interface ApiResult<T = unknown> {
  success: boolean
  status: number
  message?: string
  data?: T
  [key: string]: unknown
}

export async function fetchWithAuth<T = unknown>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
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

        const data = (await response.json()) as T
        return { success: true, ...(data as object) } as ApiResult<T>
    } catch (error) {
        return { success: false, status: 0, message: '网络错误，请检查网络连接后重试' }
    }
}
