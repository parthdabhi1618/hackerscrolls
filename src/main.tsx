import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/ibm-plex-sans/index.css'
import './styles/tokens.css'
import './styles/app.css'
import { App } from './App'
import { PrefsProvider } from './hooks/PrefsContext'
import { loadPrefs } from './lib/prefs'
import { resolveTheme } from './hooks/useTheme'

// stamp the resolved theme before first paint so Auto never flashes dark
const storedMode = loadPrefs().theme
document.documentElement.dataset.theme = resolveTheme(storedMode, window.matchMedia('(prefers-color-scheme: dark)').matches)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrefsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PrefsProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
