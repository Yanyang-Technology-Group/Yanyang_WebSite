import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

export default function RailwayMap() {
  return (
    <div className="min-h-screen bg-bg pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link
          to="/map"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-fg border border-border rounded-btn hover:bg-surface transition-all mb-4"
        >
          <ArrowLeft size={16} weight="bold" />
          返回地图
        </Link>
        <div className="w-full h-[80vh] rounded-container overflow-hidden border border-border">
          <iframe
            src="/api/map/proxy?target=http://103.40.14.23:50854"
            className="w-full h-full border-0"
            title="线路图"
          />
        </div>
      </div>
    </div>
  )
}