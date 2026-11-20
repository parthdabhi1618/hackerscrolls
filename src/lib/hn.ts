import type { FeedId, HNItem } from '../types'
import { feedDef } from '../types'

const BASE = 'https://hacker-news.firebaseio.com/v0'

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}/${path}`, { signal })
  } catch (err) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    throw new Error('Network error', { cause: err })
  }
  if (!res.ok) {
    throw new Error(`HN request failed (${res.status})`)
  }
  return (await res.json()) as T
}

/** Ordered story IDs for a feed. */
export async function fetchFeedIds(feed: FeedId, signal?: AbortSignal): Promise<number[]> {
  const ids = await getJson<number[]>(`${feedDef(feed).endpoint}.json`, signal)
  if (!Array.isArray(ids)) throw new Error('Feed list unavailable')
  return ids.filter((id): id is number => typeof id === 'number')
}

/** A single item; returns undefined when the item is missing (deleted or never existed). */
export async function fetchItem(id: number, signal?: AbortSignal): Promise<HNItem | undefined> {
  const item = await getJson<HNItem | null>(`item/${id}.json`, signal)
  return item ?? undefined
}

/**
 * Fetch items with bounded concurrency, preserving order.
 * Failed individual fetches resolve to `undefined` so one bad item can't sink a page.
 */
export async function fetchItems(
  ids: readonly number[],
  limit = 8,
  signal?: AbortSignal,
): Promise<(HNItem | undefined)[]> {
  const results: (HNItem | undefined)[] = new Array(ids.length).fill(undefined)
  let next = 0

  const runners = Array.from({ length: Math.min(limit, ids.length) }, async () => {
    for (;;) {
      const i = next++
      if (i >= ids.length) return
      const id = ids[i]
      if (typeof id !== 'number') continue
      try {
        results[i] = await fetchItem(id, signal)
      } catch (err) {
        if (signal?.aborted) throw err
        results[i] = undefined
      }
    }
  })

  await Promise.all(runners)
  return results
}
