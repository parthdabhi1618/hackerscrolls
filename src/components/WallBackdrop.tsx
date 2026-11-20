import { useEffect, useState } from 'react'
import { usePrefs } from '../hooks/PrefsContext'
import { WALLS, wallDef } from '../lib/walls'
import { getCustomWall, onCustomWallChange } from '../lib/wallStore'
import { usePrefersReducedTransparency } from '../hooks/useMediaQuery'
import type { WallId } from '../types'

/**
 * Fixed wallpaper layer behind everything. A layered scrim keeps the reading
 * column at AA contrast while leaving the edges colorful — that is what the
 * nav, scroll rail, and back-to-top glass refract against. `prefs.wall ===
 * 'custom'` resolves to the user's uploaded image from IndexedDB.
 */
export function WallBackdrop() {
  const { prefs } = usePrefs()
  const reducedTransparency = usePrefersReducedTransparency()
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})
  const [customUrl, setCustomUrl] = useState<string | null>(null)

  // the user's uploaded wall lives in IndexedDB; resolve it to an object URL
  useEffect(() => {
    let disposed = false
    let url: string | undefined

    if (prefs.wall === 'custom' && !reducedTransparency) {
      ;(async () => {
        const blob = await getCustomWall()
        if (disposed) return
        if (blob) {
          url = URL.createObjectURL(blob)
          setCustomUrl(url)
        } else {
          setCustomUrl(null)
        }
      })()
    } else {
      setCustomUrl(null)
    }

    const off = onCustomWallChange(() => {
      if (prefs.wall !== 'custom') return
      void (async () => {
        const blob = await getCustomWall()
        if (disposed) return
        if (url) URL.revokeObjectURL(url)
        if (blob) {
          url = URL.createObjectURL(blob)
          setCustomUrl(url)
        } else {
          url = undefined
          setCustomUrl(null)
        }
      })()
    })

    return () => {
      disposed = true
      off()
      if (url) URL.revokeObjectURL(url)
    }
  }, [prefs.wall, reducedTransparency])

  const isCustom = prefs.wall === 'custom'
  const wall = wallDef(prefs.wall)
  const src = !reducedTransparency ? (isCustom ? customUrl : wall.src) : undefined

  // idle-preload the bundled walls so switching in Settings doesn't flash
  useEffect(() => {
    if (!src) return
    const hasRIC = typeof window.requestIdleCallback === 'function'
    const handle: number | undefined = hasRIC
      ? window.requestIdleCallback(() => preloadOthers(src))
      : (window.setTimeout(() => preloadOthers(src), 1200) as unknown as number)

    function preloadOthers(current: string) {
      for (const w of WALLS) {
        if (w.src && w.src !== current && !failed[w.id]) {
          const img = new Image()
          img.onload = () => setLoaded((m) => ({ ...m, [w.id]: true }))
          img.src = w.src
        }
      }
    }

    return () => {
      if (handle !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(handle)
      } else if (handle !== undefined) {
        window.clearTimeout(handle)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  if (!src || (!isCustom && failed[wall.id])) return null
  const loadedKey = isCustom ? 'custom' : wall.id

  return (
    <div className="wall-backdrop" aria-hidden="true">
      <img
        className="wall-img"
        src={src}
        alt=""
        draggable={false}
        onLoad={() => setLoaded((m) => ({ ...m, [loadedKey]: true }))}
        onError={() => setFailed((m) => ({ ...m, [loadedKey]: true }))}
        style={loaded[loadedKey] ? undefined : { opacity: 0 }}
      />
      <div className="wall-scrim" />
      <div className="wall-veil" />
    </div>
  )
}

/** True when the current wall is an image (used to suppress the ambient field). */
export function wallIsPhoto(wall: WallId | undefined): boolean {
  return wall === 'custom' || Boolean(wallDef(wall ?? 'w1').src)
}
