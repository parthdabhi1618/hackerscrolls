export type FeedId = 'top' | 'new' | 'best' | 'ask' | 'show' | 'jobs'

export interface FeedDef {
  id: FeedId
  label: string
  endpoint: string
}

export const FEEDS: FeedDef[] = [
  { id: 'top', label: 'Top', endpoint: 'topstories' },
  { id: 'new', label: 'New', endpoint: 'newstories' },
  { id: 'best', label: 'Best', endpoint: 'beststories' },
  { id: 'ask', label: 'Ask HN', endpoint: 'askstories' },
  { id: 'show', label: 'Show HN', endpoint: 'showstories' },
  { id: 'jobs', label: 'Jobs', endpoint: 'jobstories' },
]

export function feedDef(id: FeedId): FeedDef {
  return FEEDS.find((f) => f.id === id) ?? FEEDS[0]!
}

/** An item from the HN Firebase API. Fields are optional; absent/deleted data is expected. */
export interface HNItem {
  id: number
  type?: 'story' | 'comment' | 'job' | 'poll' | 'pollopt'
  by?: string
  title?: string
  url?: string
  text?: string
  time?: number
  score?: number
  kids?: number[]
  descendants?: number
  deleted?: boolean
  dead?: boolean
}

export type WallId = 'w1' | 'w2' | 'w3' | 'w4' | 'custom' | 'plain'
export type ThemeMode = 'auto' | 'light' | 'dark'

export interface Prefs {
  order: FeedId[]
  hidden: FeedId[]
  defaultFeed: FeedId
  wall: WallId
  theme: ThemeMode
}
