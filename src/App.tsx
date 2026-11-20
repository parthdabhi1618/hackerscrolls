import { Navigate, Route, Routes } from 'react-router-dom'
import { TopNav } from './components/TopNav'
import { ScrollRail } from './components/ScrollRail'
import { BackToTop } from './components/BackToTop'
import { FeedPage } from './pages/FeedPage'
import { StoryPage } from './pages/StoryPage'
import { SettingsPage } from './pages/SettingsPage'
import { WallBackdrop, wallIsPhoto } from './components/WallBackdrop'
import { usePrefs } from './hooks/PrefsContext'
import { usePrefersReducedTransparency } from './hooks/useMediaQuery'
import { useApplyTheme } from './hooks/useTheme'

function DefaultFeedRedirect() {
  const { prefs } = usePrefs()
  return <Navigate to={`/feed/${prefs.defaultFeed}`} replace />
}

function NotFoundPage() {
  return (
    <section className="notfound">
      <h2>Nothing here</h2>
      <p>
        That page does not exist. <a href="/">Back to the feed</a>
      </p>
    </section>
  )
}

export function App() {
  useApplyTheme()
  const { prefs } = usePrefs()
  const reducedTransparency = usePrefersReducedTransparency()
  const photo = wallIsPhoto(prefs.wall) && !reducedTransparency
  return (
    <div className={photo ? 'app-shell has-wall' : 'app-shell'}>
      <WallBackdrop />
      <div className="app-backdrop" aria-hidden="true" />
      <TopNav />
      <main className="page" id="main">
        <Routes>
          <Route path="/" element={<DefaultFeedRedirect />} />
          <Route path="/feed/:feed" element={<FeedPage />} />
          <Route path="/story/:id" element={<StoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <ScrollRail />
      <BackToTop />
    </div>
  )
}
