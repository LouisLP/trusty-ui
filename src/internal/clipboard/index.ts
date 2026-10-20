/**
 * Copying text to the clipboard: Vue-free, and not exported from the library, like everything else under `src/internal`.
 *
 * `navigator.clipboard` exists only in a secure context, so on a page served over plain HTTP — a Storybook on an internal host, an IDE webview on a bare origin — `writeText` throws a TypeError on the click. The deprecated `document.execCommand('copy')` is the only fallback that still works there, so it stays until every deployment is HTTPS.
 */

/**
 * Copy `text`, preferring the async Clipboard API and falling back to a throwaway selection when it is unavailable or refused.
 *
 * Resolves `true` when the text reached the clipboard and `false` when neither route worked, and never rejects, so a caller can treat copying as best-effort. Must be called from a user gesture: both routes are gated on one.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      // Permission denied, or a document that isn't focused — try the fallback.
    }
  }

  return copyViaExecCommand(text)
}

/** Select the text inside an offscreen `<textarea>` and let the browser's own copy command take it. Out of the viewport rather than `display: none`, which would make it unselectable, and `readonly` so mobile keyboards stay shut. */
function copyViaExecCommand(text: string): boolean {
  if (typeof document === 'undefined')
    return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '-9999px'

  // Restored below, so the copy button keeps its ring and a keyboard user is not dropped back at the top of the document.
  const previouslyFocused = document.activeElement

  document.body.appendChild(textarea)
  try {
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    return document.execCommand('copy')
  }
  catch {
    return false
  }
  finally {
    textarea.remove()
    if (previouslyFocused instanceof HTMLElement)
      previouslyFocused.focus()
  }
}
