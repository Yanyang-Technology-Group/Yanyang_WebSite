import type { Icon } from '@phosphor-icons/react'

export interface DownloadItem {
  name: string
  link: string
  size?: string
  expiry?: string
}

export interface DownloadableItem {
  id: string
  name: string
  version: string
  date: string
  description: string
  tag: string
  public?: boolean
  downloads?: DownloadItem[]
  link?: string
  size?: string
}

export interface DownloadListData {
  tag?: string
  items?: DownloadableItem[]
}

export interface DownloadTypeConfig {
  icon: Icon
  endpoint: string
  backPath: string
  backLabelKey: string
  titleKey: string
  iconBg: string
}
