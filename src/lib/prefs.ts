import type { FeedId, Prefs, ThemeMode, WallId } from '../types'
import { FEEDS } from '../types'
import { DEFAULT_WALL } from './walls'

const STORAGE_KEY = 'hackerscrolls.prefs.v1'

export const DEFAULT_PREFS: Prefs = {
  order: FEEDS.map((f) => f.id),
  hidden: [],
  defaultFeed: 'top',
  wall: DEFAULT_WALL,
  theme: 'auto',
}

const ALL_IDS = new Set(FEEDS.map((f) => f.id))

const WALL_IDS = new Set<WallId>(['w1', 'w2', 'w3', 'w4', 'custom', 'plain'])

function isWallId(value: unknown): value is WallId {
  return typeof value === 'string' && WALL_IDS.has(value as WallId)
}

const THEME_MODES = new Set<ThemeMode>(['auto', 'light', 'dark'])

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && THEME_MODES.has(value as ThemeMode)
}

function isFeedId(value: unknown): value is FeedId {
  return typeof value === 'string' && ALL_IDS.has(value as FeedId)
}

/** Load prefs from localStorage, reconciling against the canonical feed list. */
export function loadPrefs(): Prefs {
  const fallback = { ...DEFAULT_PREFS }
  let raw: unknown
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')
  } catch {
    return fallback
  }
  if (typeof raw !== 'object' || raw === null) return fallback

  const stored = raw as Record<string, unknown>

  const order: FeedId[] = []
  const seen = new Set<FeedId>()
  if (Array.isArray(stored.order)) {
    for (const value of stored.order) {
      if (isFeedId(value) && !seen.has(value)) {
        seen.add(value)
        order.push(value)
      }
    }
  }
  for (const feed of FEEDS) {
    if (!seen.has(feed.id)) {
      seen.add(feed.id)
      order.push(feed.id)
    }
  }

  const hidden = Array.isArray(stored.hidden)
    ? [...new Set(stored.hidden.filter(isFeedId))]
    : []

  // make sure at least one feed stays visible
  const visible = order.filter((id) => !hidden.includes(id))
  if (visible.length === 0) hidden.length = 0

  const nextVisible = order.filter((id) => !hidden.includes(id))
  const defaultFeed = isFeedId(stored.defaultFeed) && nextVisible.includes(stored.defaultFeed)
    ? stored.defaultFeed
    : nextVisible[0] ?? 'top'

  const wall = isWallId(stored.wall) ? stored.wall : DEFAULT_WALL
  const theme = isThemeMode(stored.theme) ? stored.theme : DEFAULT_PREFS.theme

  return { order, hidden, defaultFeed, wall, theme }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* private mode / quota — prefs stay in memory */
  }
}

export function visibleFeeds(prefs: Prefs): FeedId[] {
  return prefs.order.filter((id) => !prefs.hidden.includes(id))
}
