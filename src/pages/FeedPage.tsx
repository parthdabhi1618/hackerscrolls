import { Navigate, useParams } from 'react-router-dom'
import type { FeedId } from '../types'
import { FEEDS, feedDef } from '../types'
import { useFeedStories, useFeedScroll, useInfiniteLoader } from '../hooks/useFeedStories'
import { StoryRow } from '../components/StoryRow'
import { FeedSkeleton, FeedStatus, NextPageSkeleton } from '../components/FeedStates'

const FEED_IDS = FEEDS.map((f) => f.id)

export function FeedPage() {
  const { feed } = useParams()

  if (!FEED_IDS.some((id) => id === feed)) {
    return <Navigate to="/feed/top" replace />
  }

  return <FeedView feed={feed as FeedId} />
}

function FeedView({ feed }: { feed: FeedId }) {
  const { idsQuery, storiesQuery, stories } = useFeedStories(feed)

  const sentinelRef = useInfiniteLoader(
    storiesQuery.hasNextPage,
    storiesQuery.isFetchingNextPage,
    storiesQuery.fetchNextPage,
  )
  useFeedScroll(feed, storiesQuery.isSuccess)

  // Errors may sit on either query; a retry refreshes both.
  const error = idsQuery.isError || storiesQuery.isError
  const ids = idsQuery.data
  const exhausted = Array.isArray(ids) && ids.length === 0
  // A disabled storiesQuery stays "pending", so gate the skeleton on actual fetches.
  const loading =
    !error && stories.length === 0 && (idsQuery.isPending || (Array.isArray(ids) && !exhausted && !storiesQuery.isFetched))
  const empty = !error && !loading && stories.length === 0 && (exhausted || storiesQuery.isFetched)

  let content: React.ReactNode
  if (loading) {
    content = <FeedSkeleton />
  } else if (error && stories.length === 0) {
    content = (
      <FeedStatus
        title="Could not load the stories"
        body="Hacker News is not responding right now. Check your connection, then try again."
        retryLabel="Try again"
        onRetry={() => {
          void idsQuery.refetch()
          void storiesQuery.refetch()
        }}
      />
    )
  } else if (empty) {
    content = (
      <FeedStatus
        title={`No ${feedDef(feed).label.toLowerCase()} stories right now`}
        body="This feed came back empty. Pick another feed from the navigation — the rest of Hacker News is still there."
      />
    )
  } else {
    content = (
      <>
        <ul className="story-list">
          {stories.map((item, index) => (
            <StoryRow key={item.id} rank={index + 1} item={item} />
          ))}
        </ul>
        {storiesQuery.isFetchingNextPage && <NextPageSkeleton />}
        {storiesQuery.isFetchNextPageError && (
          <FeedStatus
            title="Reached a dead stop"
            body="Newer stories arrived, but the next batch did not."
            retryLabel="Load more"
            onRetry={() => void storiesQuery.fetchNextPage()}
          />
        )}
        <div ref={sentinelRef} aria-hidden="true" />
      </>
    )
  }

  return (
    <section aria-label={`${feedDef(feed).label} stories`}>
      <h1 className="sr-only">{feedDef(feed).label} stories — HackerScrolls</h1>
      {content}
    </section>
  )
}
