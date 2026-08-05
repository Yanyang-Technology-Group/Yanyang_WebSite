import { TOKEN_KEY, TOKEN_EXPIRY } from '../config'

export function getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

export function setCookie(name, value, maxAge = TOKEN_EXPIRY) {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    const secureFlag = isSecure ? '; Secure' : ''
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`
}

export function removeCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0`
}

export function getToken() {
    return getCookie(TOKEN_KEY)
}

export function setToken(value, maxAge = TOKEN_EXPIRY) {
    setCookie(TOKEN_KEY, value, maxAge)
}

export function removeToken() {
    removeCookie(TOKEN_KEY)
}