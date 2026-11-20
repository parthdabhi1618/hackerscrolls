# HackerScrolls

Hacker News, unhurried. A sign-in-free reader for Hacker News with a calm, scrollable feed,
read-only discussions, and restrained liquid-glass chrome.

## Quick start

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build
```

## What's inside

- **Feed first**: Top / New / Best / Ask HN / Show HN / Jobs, one continuous feed with
  incremental paging (IntersectionObserver + TanStack infinite queries), ghost serif rank
  numerals, and domain/score/age/comment metadata.
- **Read-only discussions**: comments load on demand — top-level first, nested replies expand
  per thread. Deleted/dead items degrade gracefully. Comment count comes from `descendants`,
  never tree-crawling.
- **Left rail navigation** (≥1080px): a floating frosted rail on the left — wordmark, feeds,
  settings — with the reading column centered in the remaining width; on narrower screens it
  collapses back to the classic centered pill.
- **Light & dark**: a Theme setting (Auto / Light / Dark). Auto follows `prefers-color-scheme`;
  `main.tsx` stamps the resolved theme before first paint so Auto never flashes. Light is warm
  paper with white-frosted glass; theme-aware rgb-triplet tokens retint every hover wash,
  scrim, glass panel, and shadow.
- **Backdrops**: four photographic walls (mint *Silk*, *Magenta*, lavender *Dusk*, ember *Ember*)
  plus a plain *Ink* option and a **user-uploadable custom image** (downscaled to WebP via
  canvas, stored in IndexedDB — `src/lib/wallStore.ts`; default Silk). A fixed `WallBackdrop`
  layer renders the photo under a two-part scrim — a vertical grade plus a centered "reading
  well" — that keeps body text at AA contrast in the column while leaving wallpaper color at
  the screen edges for the glass chrome to refract.
- **Settings** (`/settings`): theme, show or hide feeds, reorder them by drag and drop, choose
  the default feed, and pick (or upload) the backdrop. Preferences live in `localStorage`
  (`hackerscrolls.prefs.v1`), the uploaded image in IndexedDB; no accounts, no server profile.
- **Static API surface**: Hacker News official Firebase API (`https://hacker-news.firebaseio.com/v0/`)
  only. Story ID lists are fetched per feed; items fetch with bounded concurrency (8) and share
  a per-item TanStack cache between feed pages and the discussion page.

## Glass, safely restrained

- The nav pill and scroll rail are CSS `backdrop-filter` surfaces — live and cheap while
  content scrolls under them. Over a photo wall they refract the wallpaper directly, which is
  where the glass effect shows best.
- `simple-liquid-glass` (3.x) provides real refraction accents elsewhere: the floating
  back-to-top button (`LiquidGlassInteractive`, pointer-elastic, click "drop" ripples) and the
  Settings panel (`LiquidGlass` over a static aurora backdrop via a sibling `backdropRef`).
- Refraction renders on Chromium; Safari/Firefox get the library's frosted fallback.
- `prefers-reduced-motion` disables pointer reactivity and smooth scrolling;
  `prefers-reduced-transparency` swaps every glass surface for a readable solid panel and
  hides the photo wall.

## Structure

```
.
├── index.html / vite.config.ts / tsconfig.json   app entry + build config
├── public/                 static files served as-is (favicon)
├── walls/                  full-resolution source photos for the backdrops
├── .agents/                optional local AI-agent skills (dev tooling only)
├── skills-lock.json        lockfile for those agent skills
└── src/
    ├── main.tsx / App.tsx  bootstrap + router/layout
    ├── types.ts            shared TypeScript types
    ├── assets/walls/       optimized WebP backdrops used by the app
    ├── lib/                HN API client (fetch + bounded-concurrency pool), HTML
    │                       sanitizer (DOMPurify), image downscaling, custom-wall
    │                       IndexedDB store, formatting, prefs storage
    ├── hooks/              prefs + theme context, feed loading, media queries
    ├── components/         TopNav, StoryRow, FeedStates, Comments, ScrollRail,
    │                       BackToTop, WallBackdrop, header skeleton
    ├── pages/              FeedPage, StoryPage, SettingsPage (+ not-found)
    └── styles/             tokens.css (design tokens) + app.css (layout & components)
```

Generated output (`dist/`, `node_modules/`) and OS cruft are gitignored; `npm run build`
regenerates `dist/` when needed.

Design system: dark basalt ink base, warm paper text, Newsreader (variable, opsz) for
titles/comment text and the italic wordmark, IBM Plex Sans for UI metadata, and the HN
heritage ember (`#FF6D2E`) as the single accent.
