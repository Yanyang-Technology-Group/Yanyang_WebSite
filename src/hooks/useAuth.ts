// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, removeToken } from '../utils/cookie'

interface JwtPayload {
  exp?: number
  [key: string]: unknown
}

// Simple JWT decode (no signature verification, only expiry check)
function decodeJWT(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1])) as JwtPayload
    return payload
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload) return true
  if (payload.exp && Date.now() > payload.exp) return true
  return false
}

export function useAuth(redirectTo = '/verify') {
  const navigate = useNavigate()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cookieToken = getToken()
    if (cookieToken && !isTokenExpired(cookieToken)) {
      setToken(cookieToken)
      setLoading(false)
    } else {
      removeToken()
      navigate(redirectTo, { state: { from: window.location.pathname }, replace: true })
    }
  }, [navigate, redirectTo])

  return { token, loading }
}
