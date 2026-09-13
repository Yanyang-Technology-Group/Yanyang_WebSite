export interface ServerServiceStatus {
    name: string
    session: string
    running: boolean
}

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
    services?: ServerServiceStatus[]
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
