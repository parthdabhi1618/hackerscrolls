import { Link, NavLink, useNavigate } from 'react-router-dom'
import type { FeedId } from '../types'
import { feedDef } from '../types'
import { usePrefs } from '../hooks/PrefsContext'

export function TopNav() {
  const { prefs } = usePrefs()
  const navigate = useNavigate()

  const visible = prefs.order.filter((id) => !prefs.hidden.includes(id))

  function goToDefault() {
    navigate(`/feed/${prefs.defaultFeed}`)
  }

  return (
    <header className="topnav">
      <nav className="topnav-inner" aria-label="Feeds">
        <Link to="/" className="brand" onClick={goToDefault}>
          HackerScrolls
        </Link>
        <ul className="nav-tabs">
          {visible.map((feedId: FeedId) => (
            <li key={feedId}>
              <NavLink
                to={`/feed/${feedId}`}
                className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
              >
                {feedDef(feedId).label}
                <span className="dot" aria-hidden="true" />
              </NavLink>
            </li>
          ))}
        </ul>
        <NavLink to="/settings" className={({ isActive }) => `nav-settings${isActive ? ' active' : ''}`}>
          Settings
        </NavLink>
      </nav>
    </header>
  )
}
