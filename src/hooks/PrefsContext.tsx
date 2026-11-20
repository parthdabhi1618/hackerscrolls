import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Prefs } from '../types'
import { loadPrefs, savePrefs } from '../lib/prefs'

interface PrefsContextValue {
  prefs: Prefs
  updatePrefs: (update: (current: Prefs) => Prefs) => void
}

const PrefsContext = createContext<PrefsContextValue | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())

  const updatePrefs = useCallback((update: (current: Prefs) => Prefs) => {
    setPrefs((current) => {
      const next = update(current)
      savePrefs(next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ prefs, updatePrefs }), [prefs, updatePrefs])

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return ctx
}
