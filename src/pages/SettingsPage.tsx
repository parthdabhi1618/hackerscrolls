import { useCallback, useEffect, useRef, useState } from 'react'
import { LiquidGlass } from 'simple-liquid-glass'
import type { FeedId, ThemeMode, WallId } from '../types'
import { feedDef } from '../types'
import { usePrefs } from '../hooks/PrefsContext'
import { usePrefersReducedMotion, usePrefersReducedTransparency } from '../hooks/useMediaQuery'
import { useResolvedTheme } from '../hooks/useTheme'
import { DEFAULT_PREFS, visibleFeeds } from '../lib/prefs'
import { WALLS } from '../lib/walls'
import { deleteCustomWall, getCustomWall, onCustomWallChange, setCustomWall } from '../lib/wallStore'
import { imageFileToBlob } from '../lib/image'

const THEME_OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function PrefsBody() {
  const { prefs, updatePrefs } = usePrefs()
  const visible = visibleFeeds(prefs)

  // drag-to-reorder state: which row is being dragged + where the drop line sits
  const [dragging, setDragging] = useState<FeedId | null>(null)
  const [dropMark, setDropMark] = useState<{ id: FeedId; after: boolean } | null>(null)
  const dropMarkRef = useRef(dropMark)
  dropMarkRef.current = dropMark

  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [wallBusy, setWallBusy] = useState(false)
  const [wallError, setWallError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // thumbnail of the uploaded wallpaper (kept in IndexedDB)
  useEffect(() => {
    let disposed = false
    let url: string | undefined
    const refresh = () => {
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
    }
    refresh()
    const off = onCustomWallChange(refresh)
    return () => {
      disposed = true
      off()
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  const onUploadPicked = useCallback(async (file: File) => {
    setWallBusy(true)
    setWallError(null)
    try {
      const blob = await imageFileToBlob(file)
      await setCustomWall(blob)
      updatePrefs((current) => ({ ...current, wall: 'custom' }))
    } catch (err) {
      setWallError(err instanceof Error && err.message === 'not an image file'
        ? 'That file isn’t an image.'
        : 'Could not add that image. Try a PNG, JPEG, or WebP.')
    } finally {
      setWallBusy(false)
    }
  }, [updatePrefs])

  async function removeCustom() {
    await deleteCustomWall()
    setCustomUrl(null)
    if (prefs.wall === 'custom') {
      updatePrefs((current) => ({ ...current, wall: 'w1' }))
    }
  }

  /** Show or hide a feed; the default feed always stays reachable. */
  function toggleHidden(feed: FeedId, shown: boolean) {
    updatePrefs((current) => {
      const hidden = shown
        ? current.hidden.filter((id) => id !== feed)
        : [...new Set([...current.hidden, feed])]
      const nextVisible = current.order.filter((id) => !hidden.includes(id))
      if (nextVisible.length === 0) return current // keep at least one feed
      const defaultFeed =
        hidden.includes(current.defaultFeed) && nextVisible.length > 0
          ? nextVisible[0]!
          : current.defaultFeed
      return { ...current, hidden, defaultFeed }
    })
  }

  const visibleSet = new Set(visible)

  /** Commit a drag: place `dragged` just before/after `anchor` in the visible order. */
  function commitReorder(dragged: FeedId, anchor: FeedId, after: boolean) {
    updatePrefs((current) => {
      const v = visibleFeeds(current)
      if (!v.includes(dragged) || anchor === dragged) return current
      const next = v.filter((id) => id !== dragged)
      const idx = next.indexOf(anchor)
      next.splice(after ? idx + 1 : idx, 0, dragged)
      // merge back into the full order: visible slots follow the new sequence,
      // hidden feeds keep their original relative positions
      let k = 0
      const curVisible = new Set(v)
      const order = current.order.map((id) => (curVisible.has(id) ? next[k++]! : id))
      return { ...current, order }
    })
  }

  const renderable = prefs.order.map((id) => ({
    id,
    shown: visibleSet.has(id),
  }))

  return (
    <>
      <section className="pref-section">
        <h2 className="pref-section-h2">Theme</h2>
        <div role="radiogroup" aria-label="Theme" className="seg">
          {THEME_OPTIONS.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name="theme"
                value={option.id}
                checked={prefs.theme === option.id}
                onChange={() => updatePrefs((current) => ({ ...current, theme: option.id }))}
              />
              <span>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="pref-section">
        <h2 className="pref-section-h2">Feeds</h2>
        <ul className="pref-rows">
          {renderable.map(({ id, shown }) => (
            <li
              className={`pref-row${shown ? '' : ' hidden-feed'}${dragging === id ? ' is-dragging' : ''}${
                dropMark?.id === id ? (dropMark.after ? ' drop-below' : ' drop-above') : ''
              }`}
              key={id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', id)
                setDragging(id)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                const rect = e.currentTarget.getBoundingClientRect()
                const after = e.clientY > rect.top + rect.height / 2
                const mark = { id, after }
                if (dragging && dragging !== id && mark !== dropMarkRef.current) setDropMark(mark)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const mark = dropMarkRef.current
                if (dragging && mark && dragging !== mark.id) {
                  commitReorder(dragging, mark.id, mark.after)
                }
                setDragging(null)
                setDropMark(null)
              }}
              onDragEnd={() => {
                setDragging(null)
                setDropMark(null)
              }}
            >
              <input
                id={`feed-${id}`}
                type="checkbox"
                checked={shown}
                onChange={(e) => toggleHidden(id, e.currentTarget.checked)}
              />
              <label htmlFor={`feed-${id}`}>{feedDef(id).label}</label>
            </li>
          ))}
        </ul>
        <p className="prefs-note">Drag feeds to reorder them.</p>
      </section>

      <section className="pref-section">
        <h2 className="pref-section-h2">Default feed</h2>
        <div role="radiogroup" aria-label="Default feed" className="seg">
          {visible.map((id) => (
            <label key={id}>
              <input
                type="radio"
                name="default-feed"
                value={id}
                checked={prefs.defaultFeed === id}
                onChange={() => updatePrefs((current) => ({ ...current, defaultFeed: id }))}
              />
              <span>{feedDef(id).label}</span>
            </label>
          ))}
        </div>
        <p className="prefs-note">Changes apply immediately and are kept on this device.</p>
      </section>

      <section className="pref-section">
        <h2 className="pref-section-h2">Background</h2>
        <div role="radiogroup" aria-label="Background wallpaper" className="wall-grid">
          {WALLS.slice(0, 4).map((wall) => (
            <WallTile key={wall.id} wallId={wall.id} name={wall.name} thumb={wall.src} />
          ))}
          <WallTile
            wallId="custom"
            name="Custom"
            thumb={customUrl ?? undefined}
            disabled={!customUrl}
            dashed={!customUrl}
            title={customUrl ? undefined : 'Upload an image below first'}
          />
          <WallTile wallId="plain" name="Ink" />
        </div>
        <div className="wall-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={wallBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {wallBusy ? 'Adding…' : customUrl ? 'Replace image…' : 'Upload your own…'}
          </button>
          {customUrl ? (
            <button type="button" className="btn btn-ghost" onClick={() => void removeCustom()}>
              Remove custom
            </button>
          ) : null}
        </div>
        {wallError ? (
          <p className="prefs-note" role="alert">{wallError}</p>
        ) : (
          <p className="prefs-note">Your image stays on this device (PNG, JPEG, or WebP).</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (file) void onUploadPicked(file)
          }}
        />
      </section>

      <button className="btn btn-ghost prefs-reset" onClick={() => updatePrefs(() => ({ ...DEFAULT_PREFS }))}>
        Restore defaults
      </button>
    </>
  )
}

function WallTile({
  wallId,
  name,
  thumb,
  disabled = false,
  dashed = false,
  title,
}: {
  wallId: WallId
  name: string
  thumb?: string
  disabled?: boolean
  dashed?: boolean
  title?: string
}) {
  const { prefs, updatePrefs } = usePrefs()
  return (
    <label
      className={`wall-option${disabled ? ' is-disabled' : ''}`}
      title={title ?? name}
    >
      <input
        type="radio"
        name="wall"
        value={wallId}
        disabled={disabled}
        checked={prefs.wall === wallId}
        onChange={() => updatePrefs((current) => ({ ...current, wall: wallId as WallId }))}
      />
      <span
        className={`wall-thumb${thumb ? '' : ' wall-thumb-plain'}${dashed ? ' wall-thumb-dashed' : ''}`}
        style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
        aria-hidden="true"
      >
        {dashed ? <span className="wall-thumb-plus">+</span> : null}
      </span>
      <span className="wall-option-name">{name}</span>
    </label>
  )
}

/** Settings — a lightweight control panel on a glass sheet. */
export function SettingsPage() {
  const reducedMotion = usePrefersReducedMotion()
  const reducedTransparency = usePrefersReducedTransparency()
  const theme = useResolvedTheme()
  const backdropRef = useRef<HTMLDivElement | null>(null)

  return (
    <section className="settings-wrap" aria-label="Settings">
      <h1 className="settings-h1">Settings</h1>
      <p className="settings-intro">
        Choose which feeds appear in the navigation, put them in your preferred order, pick the one
        that opens first, set the backdrop the glass sits on, and switch between light and dark.
      </p>

      {reducedTransparency || reducedMotion ? (
        <section className="pref-section settings-panel">
          <PrefsBody />
        </section>
      ) : (
        <div className="settings-glass-wrap">
          <div ref={backdropRef} className="settings-aurora" aria-hidden="true" />
          <LiquidGlass
            className="settings-glass"
            radius={18}
            lens="shift"
            angle={-30}
            lensStrength={0.8}
            scale={130}
            saturation={116}
            frost={0.14}
            glassColor={theme === 'light' ? 'rgba(255, 255, 255, 0.38)' : 'rgba(30, 36, 46, 0.6)'}
            alpha={0.9}
            borderColor={theme === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.16)'}
            backdropRef={backdropRef}
            style={{ width: '100%', minHeight: 560, display: 'block', marginTop: 34 }}
          >
            <div className="settings-glass-inner">
              <PrefsBody />
            </div>
          </LiquidGlass>
        </div>
      )}
    </section>
  )
}
