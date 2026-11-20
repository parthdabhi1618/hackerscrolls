import { useEffect } from 'react'
import type { ThemeMode } from '../types'
import { usePrefs } from './PrefsContext'
import { useMediaQuery } from './useMediaQuery'

export type ResolvedTheme = 'dark' | 'light'

export function resolveTheme(mode: ThemeMode, osDark: boolean): ResolvedTheme {
  if (mode === 'auto') return osDark ? 'dark' : 'light'
  return mode
}

/** Pure resolved theme of the current prefs + OS preference (no DOM writes). */
export function useResolvedTheme(): ResolvedTheme {
  const { prefs } = usePrefs()
  const osDark = useMediaQuery('(prefers-color-scheme: dark)')
  return resolveTheme(prefs.theme, osDark)
}

/**
 * Applies resolved theme to <html data-theme> for token switching.
 * Mounted once in App; components that need the value use useResolvedTheme.
 */
export function useApplyTheme(): ResolvedTheme {
  const resolved = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = resolved
  }, [resolved])
  return resolved
}
