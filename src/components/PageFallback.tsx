import Skeleton from './Skeleton'

/**
 * Placeholder skeleton shown while a lazily loaded route chunk is in flight.
 * Its height roughly matches a typical page's first screen so the arrival of
 * the real page does not cause a large layout shift.
 */
export default function PageFallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-24 pb-16" aria-busy="true" aria-live="polite">
      <Skeleton className="h-9 w-2/3 mx-auto" />
      <Skeleton className="mt-4 h-4 w-1/2 mx-auto" />
      <Skeleton className="mt-10 h-40 w-full" />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}
