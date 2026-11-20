import DOMPurify from 'dompurify'

let configured = false

function configure() {
  if (configured) return
  configured = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node instanceof HTMLAnchorElement) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

/**
 * Sanitize HN-authored HTML (titles, story text, comment text).
 * Allows HN's usual formatting (links, code, blockquotes, lists) and
 * strips anything executable. Links always open externally.
 */
export function sanitizeHtml(raw: string | undefined | null): string {
  if (!raw) return ''
  configure()
  // DOMPurify's default URI policy already restricts href/src to safe schemes
  // (http, https, mailto, tel, …) and blocks data:/vbscript: URIs.
  return DOMPurify.sanitize(raw, {
    FORBID_TAGS: ['img', 'svg', 'iframe', 'style', 'video', 'audio', 'form', 'input', 'button'],
    FORBID_ATTR: ['style', 'id', 'class', 'bgcolor'],
  })
}
