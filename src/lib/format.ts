/** Compact relative age, e.g. \"4h\" — same vocabulary HN readers already know. */
export function ageStamp(timeSeconds: number | undefined): string {
  if (!timeSeconds || timeSeconds <= 0) return '?'
  const ms = Math.max(0, Date.now() - timeSeconds * 1000)
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'just now'
  const hrs = Math.floor(mins / 60)
  if (hrs < 1) return `${mins}m`
  const days = Math.floor(hrs / 24)
  if (days < 1) return `${hrs}h`
  if (days < 31) return `${days}d`
  const months = Math.floor(days / 30.5)
  if (months < 12) return `${months}mo`
  return `${Math.floor(days / 365.25)}y`
}

export function timeFull(timeSeconds: number | undefined): string {
  if (!timeSeconds || timeSeconds <= 0) return ''
  return new Date(timeSeconds * 1000).toISOString()
}

/** Hostname without a leading www., or null when there is no usable URL. */
export function domainOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname
    return host.replace(/^www\./, '') || null
  } catch {
    return null
  }
}

export function formatCount(n: number | undefined): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return ''
  return n.toLocaleString('en-US')
}

export function hnItemUrl(id: number): string {
  return `https://news.ycombinator.com/item?id=${id}`
}
