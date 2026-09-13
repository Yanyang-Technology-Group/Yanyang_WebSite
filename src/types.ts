export interface ServerStats {
  timestamp?: string
  hostname?: string
  platform?: string
  uptime?: number
  load?: number[]
  cpu?: {
    cores?: number
    model?: string
    usagePercent?: number
  }
  memory?: {
    total?: number
    used?: number
    percent?: number
  }
  disk?: {
    total?: number
    used?: number
    percent?: number
  } | null
  services?: {
    name: string
    session: string
    running: boolean
    status?: 'running' | 'starting' | 'stopped'
  }[]
}
