import { TOKEN_KEY, TOKEN_EXPIRY } from '../config'

export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
        const result = parts.pop()?.split(';').shift()
        return result || null
    }
    return null
}

export function setCookie(name: string, value: string, maxAge = TOKEN_EXPIRY): void {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    const secureFlag = isSecure ? '; Secure' : ''
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`
}

export function removeCookie(name: string): void {
    document.cookie = `${name}=; path=/; max-age=0`
}

export function getToken(): string | null {
    return getCookie(TOKEN_KEY)
}

export function setToken(value: string, maxAge = TOKEN_EXPIRY): void {
    setCookie(TOKEN_KEY, value, maxAge)
}

export function removeToken(): void {
    removeCookie(TOKEN_KEY)
}
