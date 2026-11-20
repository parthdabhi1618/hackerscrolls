import { useEffect, useRef } from 'react'

/**
 * A thin glass sheet on the right edge that mirrors scroll position.
 * Purely decorative; native scrolling is untouched. Updates happen on a
 * rAF-throttled listener writing directly to element styles (no re-renders).
 */
export function ScrollRail() {
  const railRef = useRef<HTMLDivElement | null>(null)
  const thumbRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const rail = railRef.current
    const thumb = thumbRef.current
    if (!rail || !thumb) return

    let raf = 0

    const update = () => {
      raf = 0
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      const scrollable = total > 24
      rail.classList.toggle('is-active', scrollable && window.scrollY > 4)
      if (!scrollable) return

      const railH = rail.clientHeight || window.innerHeight - 40
      const docH = doc.scrollHeight
      const viewH = window.innerHeight

      const thumbH = Math.min(railH, Math.max(32, railH * (viewH / docH)))
      const progress = Math.min(1, Math.max(0, window.scrollY / total))

      thumb.style.height = `${Math.round(thumbH)}px`
      thumb.style.transform = `translateY(${Math.round((railH - thumbH) * progress)}px)`
    }

    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    const ro = new ResizeObserver(queue)
    ro.observe(document.body)
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue, { passive: true })
    update()

    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={railRef} className="scrollrail" aria-hidden="true">
      <div ref={thumbRef} className="scrollrail-thumb" />
    </div>
  )
}
