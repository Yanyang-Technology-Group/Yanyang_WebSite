export default function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface ${className}`}
      {...props}
    />
  )
}

export function SkeletonLine({ width = '100%' }) {
  return <Skeleton style={{ width }} className="h-4" />
}

export function SkeletonBlock({ height = '200px' }) {
  return <Skeleton style={{ height }} className="w-full" />
}
