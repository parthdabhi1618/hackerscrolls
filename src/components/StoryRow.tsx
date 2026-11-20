import { Link } from 'react-router-dom'
import type { HNItem } from '../types'
import { ageStamp, domainOf, formatCount, timeFull } from '../lib/format'
import { sanitizeHtml } from '../lib/html'

export interface StoryRowProps {
  rank: number
  item: HNItem
}

/** One ranked story row in the feed. Titles open the discussion; the domain opens the article. */
export function StoryRow({ rank, item }: StoryRowProps) {
  const isJob = item.type === 'job'
  const domain = domainOf(item.url)
  const excerpt = sanitizeHtml(item.text)

  return (
    <li className="story-row">
      <div className="rank" aria-hidden="true">
        {rank}
      </div>
      <div>
        <h3 className="story-title">
          {/* HN titles can contain entities and rare tags — render sanitized HTML */}
          <Link to={`/story/${item.id}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.title) }} />
        </h3>

        {excerpt ? (
          <p className="story-excerpt" dangerouslySetInnerHTML={{ __html: excerpt }} />
        ) : null}

        <div className="story-meta">
          {!isJob && (
            <>
              <span className="meta-score">{formatCount(item.score)} points</span>
              {item.by && (
                <span>
                  by <span className="by-author">{item.by}</span>
                </span>
              )}
            </>
          )}
          {item.time && (
            <time dateTime={timeFull(item.time)} title={timeFull(item.time)}>
              {ageStamp(item.time)} ago
            </time>
          )}
          {domain && item.url && (
            <a className="meta-link meta-domain" href={item.url} target="_blank" rel="noopener noreferrer">
              {domain}
            </a>
          )}
          {!isJob && typeof item.descendants === 'number' && (
            <Link className="meta-link" to={`/story/${item.id}`}>
              {formatCount(item.descendants)} comment{item.descendants === 1 ? '' : 's'}
            </Link>
          )}
        </div>
      </div>
    </li>
  )
}
