import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export function useAuth(redirectTo = '/verify') {
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cookieToken = getCookie('download_token')
    if (cookieToken) {
      setToken(cookieToken)
      setLoading(false)
    } else {
      navigate(redirectTo, { state: { from: window.location.pathname }, replace: true })
    }
  }, [navigate, redirectTo])

  return { token, loading }
}