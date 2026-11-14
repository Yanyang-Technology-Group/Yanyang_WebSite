export type ServiceStatus = 'running' | 'starting' | 'stopped' | 'unknown'

export interface ServerServiceStatus {
    name: string
    group: string
    check: 'process' | 'tmux' | 'tcp' | 'docker_compose'
    target: string
    status: ServiceStatus
    detail?: string
}

export interface ServerMetrics {
    timestamp?: string
    hostname?: string
    platform?: string
    uptime?: number
    load?: number[]
    cpu?: {
        cores?: number
        model?: string
        usagePercent?: number
        busyCores?: number
    }
    memory?: {
        total?: number
        used?: number
        percent?: number
        usedMB?: number
    }
    disk?: {
        total?: number
        used?: number
        percent?: number
        readBytesPerSec?: number
        writeBytesPerSec?: number
    } | null
    network?: {
        rxBytesPerSec?: number
        txBytesPerSec?: number
    }
    services?: ServerServiceStatus[]
}

export interface ServerStats {
    serverId: string
    displayName: string
    intervalSeconds?: number
    receivedAt: number
    metrics: ServerMetrics
}

export interface Env {
    GITHUB_TOKEN: string;
    REPO_OWNER: string;
    REPO_NAME: string;
    JWT_SECRET: string;
    CLOUDMAIL_EMAIL: string;
    CLOUDMAIL_PASSWORD: string;
    RESEND_TOKEN?: string;
    LOGIN_NOTIFY_EMAIL?: string;
    STATS_INGEST_TOKEN?: string;
    DB: D1Database;
}
