export function simpleJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = btoa(encodedHeader + '.' + encodedPayload + secret)
  return encodedHeader + '.' + encodedPayload + '.' + signature
}

export function verifySimpleJWT(token, secret) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}