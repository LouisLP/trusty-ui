import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach } from 'vitest'

// jsdom is missing a few browser APIs that Reka UI's primitives (under Trusty UI) touch on mount: (ResizeObserver for sizing, pointer-capture for the slider). No-op stubs are enough for unit tests, which assert on markup/state rather than geometry.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
  }
}

const el = globalThis.Element?.prototype
if (el && !el.hasPointerCapture) {
  el.hasPointerCapture = () => false
  el.setPointerCapture = () => { }
  el.releasePointerCapture = () => { }
}

// CodeMirror (under TrustyCodeBlock's editor and TrustyMarkdownEditor) measures its own text to lay out lines, and jsdom implements Range without either rect method. Empty rects are enough: jsdom has no layout to report, and the editor specs assert on document state rather than on geometry.
const range = globalThis.Range?.prototype
if (range && !range.getClientRects) {
  const empty = () => Object.assign([], { item: () => null }) as unknown as DOMRectList
  range.getClientRects = empty
  range.getBoundingClientRect ??= () => new DOMRect()
}

// Every spec starts on an empty document. Reka portals overlays into document.body, so a wrapper left mounted leaks its overlay into the next test. Registered in this order because after-hooks run in reverse: wrappers unmount first, then the body is wiped — clearing it out from under a still-mounted portal breaks Vue's patch.
afterEach(() => {
  document.body.innerHTML = ''
})
enableAutoUnmount(afterEach)
