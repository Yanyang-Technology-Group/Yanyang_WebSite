export interface PasswordEntry {
    password: string;
    type: 'full' | 'public';
    label: string;
    email: string;
}

export interface DownkeyData {
    passwords: PasswordEntry[];
}

export interface DownloadItem {
    name: string;
    link: string;
    size: string;
    expiry?: string;
}

export interface ModpackItem {
    id: string;
    name: string;
    version: string;
    date: string;
    description: string;
    tag: string;
    public: boolean;
    downloads: DownloadItem[];
}

export interface ModpackData {
    tag: string;
    items: ModpackItem[];
}

export interface JavaItem {
    id: string;
    name: string;
    version: string;
    date: string;
    description: string;
    tag: string;
    public: boolean;
    downloads: DownloadItem[];
}

export interface JavaData {
    tag: string;
    items: JavaItem[];
}

export interface LauncherItem {
    id: string;
    name: string;
    version: string;
    description: string;
    tag: string;
    public: boolean;
    link: string;
    size: string;
}

export interface LauncherData {
    items: LauncherItem[];
}

export interface Env {
    GITHUB_TOKEN: string;
    REPO_OWNER: string;
    REPO_NAME: string;
    JWT_SECRET: string;
    CLOUDMAIL_EMAIL: string;
    CLOUDMAIL_PASSWORD: string;
    ONE_TIME_SECRET: string;
    RESEND_TOKEN?: string;
    KV?: KVNamespace;
}