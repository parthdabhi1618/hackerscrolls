export function FeedSkeleton() {
  return (
    <div role="status" aria-label="Loading stories">
      <ul className="story-list" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <li className="skeleton-row" key={i}>
            <div className="skeleton skeleton-rank" />
            <div>
              <div className={`skeleton skeleton-title${i % 2 ? ' skeleton-title--short' : ''}`} />
              <div className="skeleton skeleton-meta" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface FeedStatusProps {
  title: string
  body: string
  retryLabel?: string
  onRetry?: () => void
}

/** Inline error/empty state with an optional retry action. */
export function FeedStatus({ title, body, retryLabel, onRetry }: FeedStatusProps) {
  return (
    <div className="feed-status" role={onRetry ? 'status' : undefined}>
      <h2>{title}</h2>
      <p>{body}</p>
      {onRetry && retryLabel && (
        <button className="btn btn-ghost" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  )
}

/** Small shimmer shown at the bottom of the list while the next page fetches. */
export function NextPageSkeleton() {
  return (
    <div role="status" aria-label="Loading more stories">
      <ul className="story-list" aria-hidden="true">
        {[0, 1].map((i) => (
          <li className="skeleton-row" key={i}>
            <div className="skeleton skeleton-rank" />
            <div>
              <div className={`skeleton skeleton-title${i ? ' skeleton-title--short' : ''}`} />
              <div className="skeleton skeleton-meta" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
