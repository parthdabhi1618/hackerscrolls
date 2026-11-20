import { useEffect, useState } from 'react'
import { LiquidGlass } from 'simple-liquid-glass'
import { LiquidGlassInteractive } from 'simple-liquid-glass/interactive'
import { usePrefersReducedMotion, usePrefersReducedTransparency } from '../hooks/useMediaQuery'
import { useResolvedTheme } from '../hooks/useTheme'

function ArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 19V5m0 0-6 6m6-6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Floating glass button; appears after the reader has scrolled a little. */
export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const reducedTransparency = usePrefersReducedTransparency()
  const theme = useResolvedTheme()
  const glassColor = theme === 'light' ? 'rgba(255, 255, 255, 0.42)' : 'rgba(34, 41, 51, 0.6)'
  const glassColorStatic = theme === 'light' ? 'rgba(255, 255, 255, 0.46)' : 'rgba(34, 41, 51, 0.62)'
  const borderColor = theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.24)'

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480)
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <div className={`backtotop${visible ? ' is-visible' : ''}${reducedTransparency ? ' backtotop--plain' : ''}`}>
      {reducedTransparency ? (
        <button className="backtotop-btn" aria-label="Back to top" onClick={scrollToTop}>
          <ArrowIcon />
        </button>
      ) : reducedMotion ? (
        // no pointer reactivity when motion is reduced — static glass instead
        <LiquidGlass
          className="backtotop-glass"
          radius={26}
          lens="convex"
          lensStrength={1.1}
          scale={140}
          saturation={115}
          glassColor={glassColorStatic}
          alpha={0.9}
          borderColor={borderColor}
        >
          <button className="backtotop-btn" aria-label="Back to top" onClick={scrollToTop}>
            <ArrowIcon />
          </button>
        </LiquidGlass>
      ) : (
        <LiquidGlassInteractive
          className="backtotop-glass"
          radius={26}
          lens="convex"
          lensStrength={1.1}
          scale={150}
          saturation={115}
          glassColor={glassColor}
          alpha={0.88}
          borderColor={borderColor}
          elasticity={0.3}
          maxShift={12}
          followPointer
          clickRipple="drop"
        >
          <button className="backtotop-btn" aria-label="Back to top" onClick={scrollToTop}>
            <ArrowIcon />
          </button>
        </LiquidGlassInteractive>
      )}
    </div>
  )
}
