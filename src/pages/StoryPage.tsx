import { useParams } from 'react-router-dom'
import { useCachedItem } from '../hooks/useFeedStories'
import { ageStamp, domainOf, formatCount, timeFull } from '../lib/format'
import { sanitizeHtml } from '../lib/html'
import { StoryHeaderSkeleton } from '../components/StoryHeaderSkeleton'
import { FeedStatus } from '../components/FeedStates'
import { CommentList } from '../components/Comments'

export function StoryPage() {
  const { id: rawId } = useParams()
  const id = Number.parseInt(rawId ?? '', 10)

  if (!Number.isFinite(id)) {
    return (
      <FeedStatus
        title="That link is not a story"
        body="The address points somewhere Hacker News does not keep."
      />
    )
  }

  return <StoryView id={id} />
}

function StoryView({ id }: { id: number }) {
  const query = useCachedItem(id)
  const item = query.data

  if (query.isError) {
    return (
      <FeedStatus
        title="Could not load this story"
        body="The story did not arrive from Hacker News. Check your connection, then try again."
        retryLabel="Try again"
        onRetry={() => void query.refetch()}
      />
    )
  }

  if (query.isPending) {
    return <StoryHeaderSkeleton />
  }

  const missing = !item || item.deleted
  if (missing) {
    return (
      <FeedStatus
        title="This story is gone"
        body="It was removed from Hacker News, so there is nothing to show here."
      />
    )
  }

  if (item.type !== 'story' && item.type !== 'job') {
    return (
      <FeedStatus
        title="This is a comment, not a story"
        body="Only stories and job posts can be opened here."
      />
    )
  }

  const isJob = item.type === 'job'
  const domain = domainOf(item.url)
  const body = sanitizeHtml(item.text)
  const commentCount = item.descendants ?? item.kids?.length ?? 0

  return (
    <article>
      <header className="story-header">
        <h1 className="story-h1" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.title) }} />

        <div className="story-meta">
          {!isJob && (
            <>
              <span className="meta-score">{formatCount(item.score)} points</span>
              {item.by && <span>by {item.by}</span>}
            </>
          )}
          {item.time && (
            <time dateTime={timeFull(item.time)}>
              {ageStamp(item.time)} ago
            </time>
          )}
          {domain && item.url && (
            <a className="meta-link meta-domain" href={item.url} target="_blank" rel="noopener noreferrer">
              {domain}
            </a>
          )}
        </div>

        <div className="story-actions">
          {item.url && (
            <a className="btn btn-primary" href={item.url} target="_blank" rel="noopener noreferrer">
              Open the original article
            </a>
          )}
          <a
            className="btn btn-ghost"
            href={`https://news.ycombinator.com/item?id=${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Hacker News
          </a>
        </div>

        {body && (
          <div className="story-body">
            <div className="hn-text" dangerouslySetInnerHTML={{ __html: body }} />
          </div>
        )}
      </header>

      {!isJob && (
        <section className="comments" aria-label="Discussion">
          <h2 className="comments-h2">
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </h2>
          <CommentList kids={item.kids ?? []} />
        </section>
      )}
    </article>
  )
}
