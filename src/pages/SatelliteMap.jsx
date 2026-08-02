import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { API_BASE_URL } from '../config'

export default function SatelliteMap() {
  return (
    <div className="min-h-screen bg-bg pt-16 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all"
          >
            <ArrowLeft size={16} weight="bold" />
            返回
          </Link>
        </div>
        <div className="w-full h-[calc(100vh-150px)] rounded-container overflow-hidden border border-border bg-surface">
          <iframe
            src={`${API_BASE_URL}/api/map/proxy?target=http://103.40.14.23:28826`}
            className="w-full h-full border-0"
            title="卫星地图"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}