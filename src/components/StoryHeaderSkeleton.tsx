export function StoryHeaderSkeleton() {
  return (
    <div role="status" aria-label="Loading story" className="story-header">
      <div className="skeleton skeleton-title skeleton-title--short" style={{ width: '84%' }} />
      <div className="skeleton skeleton-title" style={{ width: '38%' }} />
      <div className="skeleton skeleton-meta" style={{ width: '46%' }} />
      <div style={{ height: 34 }} />
      <div className="comments" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div className="skeleton skeleton-meta" style={{ width: `${28 - i * 4}%` }} />
            <div className="skeleton skeleton-title" style={{ width: `${70 - i * 12}%`, marginTop: 10 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
