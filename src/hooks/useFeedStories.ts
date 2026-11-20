import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { FeedId } from '../types'
import { fetchFeedIds, fetchItem, fetchItems } from '../lib/hn'
import type { HNItem } from '../types'

const STORIES_PER_PAGE = 12
const STORY_STALE_MS = 5 * 60_000

/**
 * Per-item cache (stories and comments share one cache).
 */
export function useCachedItem(id: number, enabled = true) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: ({ signal }) => fetchItem(id, signal),
    enabled,
    staleTime: STORY_STALE_MS,
  })
}

/** Feed story IDs, cached briefly so pages of items can stream in after it. */
export function useFeedIds(feed: FeedId) {
  return useQuery({
    queryKey: ['feed-ids', feed],
    queryFn: ({ signal }) => fetchFeedIds(feed, signal),
    staleTime: STORY_STALE_MS,
    refetchOnWindowFocus: false,
  })
}

/**
 * Stories for a feed, streamed page by page. Each page fetches a window of
 * item IDs with bounded concurrency and primes the item cache.
 */
export function useFeedStories(feed: FeedId) {
  const queryClient = useQueryClient()
  const idsQuery = useFeedIds(feed)
  const ids = idsQuery.data

  const storiesQuery = useInfiniteQuery({
    queryKey: ['feed-stories', feed, ids?.length ?? -1],
    enabled: Array.isArray(ids),
    queryFn: async ({ pageParam, signal }) => {
      const start = pageParam as number
      const list = ids!
      const slice = list.slice(start, start + STORIES_PER_PAGE)
      const items = await fetchItems(slice, 8, signal)
      items.forEach((item) => {
        if (item) queryClient.setQueryData(['item', item.id], item)
      })
      return items
    },
    initialPageParam: 0,
    getPreviousPageParam: () => undefined,
    getNextPageParam: (lastPage, _allPages, lastPageParam): number | undefined => {
      const next = Number(lastPageParam) + STORIES_PER_PAGE
      if (!ids || next >= ids.length || lastPage.length === 0) return undefined
      return next
    },
    staleTime: STORY_STALE_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const stories: HNItem[] = []
  for (const page of storiesQuery.data?.pages ?? []) {
    for (const item of page) {
      if (item && !item.deleted && !item.dead) stories.push(item)
    }
  }

  return { idsQuery, storiesQuery, stories, hasIdsById: Array.isArray(ids) }
}

/**
 * Load more when a sentinel scrolls into view.
 */
export function useInfiniteLoader(
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !fetchingRef.current) {
          fetchingRef.current = true
          fetchNextPage()
          // allow the next batch once the page registry updates
          setTimeout(() => {
            fetchingRef.current = isFetchingNextPage
          }, 200)
        }
      },
      { rootMargin: '600px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (!isFetchingNextPage) fetchingRef.current = false
  }, [isFetchingNextPage])

  return sentinelRef
}

/**
 * Preserve scroll position per feed across feed ↔ story navigation.
 * Saves continuously (debounced) because the feed's DOM is torn down
 * during route changes, which clamps window scroll before cleanup runs.
 */
export function useFeedScroll(feed: FeedId, readyToRestore: boolean) {
  const restoredRef = useRef<FeedId | null>(null)

  useEffect(() => {
    const key = `hn.scroll.${feed}`
    let timer = 0
    const save = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY))
      } catch {
        /* ignore */
      }
    }
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(save, 250)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      window.clearTimeout(timer)
    }
  }, [feed])

  useEffect(() => {
    if (!readyToRestore || restoredRef.current === feed) return
    restoredRef.current = feed
    let y = 0
    try {
      y = parseInt(sessionStorage.getItem(`hn.scroll.${feed}`) ?? '0', 10) || 0
    } catch {
      /* ignore */
    }
    if (y > 0) {
      // wait for feed content to paint before jumping
      requestAnimationFrame(() => {
        window.scrollTo(0, y)
      })
    }
  }, [feed, readyToRestore])
}

/** Shared retry handler that refetches both identifiers and first page. */
export function useFeedRetry(
  refetchIds: () => void,
  refetchStories: () => void,
) {
  return useCallback(() => {
    refetchIds()
    refetchStories()
  }, [refetchIds, refetchStories])
}
