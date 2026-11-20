import { useState } from 'react'
import { useCachedItem } from '../hooks/useFeedStories'
import { ageStamp, hnItemUrl, timeFull } from '../lib/format'
import { sanitizeHtml } from '../lib/html'

export interface CommentNodeProps {
  id: number
}

/**
 * One comment and its lazily-expanded replies. Each node owns its own item
 * query; top-level nodes hit the per-item cache primed when the feed pages loaded.
 */
export function CommentNode({ id }: CommentNodeProps) {
  const query = useCachedItem(id)
  const item = query.data
  const [open, setOpen] = useState(false)

  if (query.isError) {
    return (
      <li className="comment">
        <p className="comment-error">
          Comment did not arrive.
          <button className="comment-retry" onClick={() => void query.refetch()}>
            Try again
          </button>
        </p>
      </li>
    )
  }

  const removed = !item || item.deleted
  const dead = item?.dead === true
  const kidIds = item?.kids ?? []
  const text = removed ? '' : sanitizeHtml(item.text)
  const visible = !removed && (text.length > 0 || query.isPending)

  return (
    <li className="comment">
      <div className="comment-head">
        {!removed && (
          <>
            <button
              className="collapse"
              aria-expanded={open}
              aria-label={open ? 'Collapse comment' : 'Expand comment'}
              hidden={kidIds.length === 0 || !visible}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="glyph" aria-hidden="true">▾</span>
            </button>
            <span className={`comment-author${dead ? ' is-dead' : ''}`}>
              {item.by ?? '[unnamed]'}
            </span>
            {!item.time && null}
            {item.time && (
              <a className="comment-time" href={hnItemUrl(item.id)} target="_blank" rel="noopener noreferrer">
                <time dateTime={timeFull(item.time)}>{ageStamp(item.time)} ago</time>
              </a>
            )}
          </>
        )}
        {removed && (
          <>
            <button
              className="collapse"
              aria-expanded={open}
              aria-label={open ? 'Collapse replies' : 'Expand replies'}
              hidden={kidIds.length === 0}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="glyph" aria-hidden="true">▾</span>
            </button>
            <span className="comment-author is-dead">[removed]</span>
          </>
        )}
      </div>

      {removed ? (
        <div className="hn-text comment-body is-dead">[comment removed]</div>
      ) : text ? (
        <div
          className={`hn-text comment-body${dead ? ' is-dead' : ''}`}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : (
        query.isSuccess && (
          <div className="hn-text comment-body is-dead">[no text]</div>
        )
      )}

      {query.isPending && (
        <div className="hn-text comment-body is-dead" aria-hidden="true">…</div>
      )}

      {kidIds.length > 0 && !open && (
        <button className="comment-thread-action" aria-expanded={false} onClick={() => setOpen(true)}>
          <span className="glyph" aria-hidden="true">▾</span>
          {kidIds.length} {kidIds.length === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {kidIds.length > 0 && open && (
        <>
          <button className="comment-thread-action" aria-expanded onClick={() => setOpen(false)}>
            <span className="glyph" aria-hidden="true">▾</span>
            hide replies
          </button>
          <ul className="comment-list">
            {kidIds.map((kid) => (
              <CommentNode key={kid} id={kid} />
            ))}
          </ul>
        </>
      )}
    </li>
  )
}

export interface CommentListProps {
  kids: readonly number[]
}

export function CommentList({ kids }: CommentListProps) {
  if (kids.length === 0) {
    return <p className="no-comments">No comments yet.</p>
  }
  return (
    <ul className="comment-list">
      {kids.map((kid) => (
        <CommentNode key={kid} id={kid} />
      ))}
    </ul>
  )
}
