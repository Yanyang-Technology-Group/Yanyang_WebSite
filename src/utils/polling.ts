// A timer/manual refresh must never cancel a request already in flight.
// Only disposal (unmount/range change) or the request deadline aborts it.
export function startPolling(request: (signal: AbortSignal) => Promise<number | void>, intervalMs = 30_000, timeoutMs = 55_000) {
  let stopped = false
  let pending = false
  let nextAllowed = 0
  let controller: AbortController | undefined
  let retry: ReturnType<typeof setTimeout> | undefined
  const refresh = async () => {
    if (stopped || pending || Date.now() < nextAllowed) return
    pending = true
    clearTimeout(retry)
    const current = new AbortController()
    controller = current
    const timeout = setTimeout(() => current.abort(), timeoutMs)
    try {
      const retryAfterMs = await request(current.signal)
      if (!stopped && typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs)) {
        const delay = Math.max(1_000, Math.min(300_000, retryAfterMs))
        nextAllowed = Date.now() + delay
        retry = setTimeout(() => { void refresh() }, delay)
      }
    } finally {
      clearTimeout(timeout)
      pending = false
    }
  }
  void refresh()
  const timer = setInterval(() => { void refresh() }, intervalMs)
  return {
    refresh: () => { void refresh() },
    stop: () => { stopped = true; controller?.abort(); clearTimeout(retry); clearInterval(timer) },
  }
}
