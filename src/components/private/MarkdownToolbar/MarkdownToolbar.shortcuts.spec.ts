import { describe, expect, it } from 'vitest'
import { ariaKeyShortcuts, MARKDOWN_TOOLBAR_ITEMS, markdownShortcutFor } from './MarkdownToolbar.actions'

/** A keydown as the browser reports it, `code` included — Shift rewrites `key`. */
function keydown(init: Partial<KeyboardEvent>): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: '', code: '', ...init })
}

describe('markdownToolbar shortcuts', () => {
  it('gives every action a shortcut, and none of them twice', () => {
    const printed = MARKDOWN_TOOLBAR_ITEMS.map(item => ariaKeyShortcuts(item.shortcut))

    expect(printed).toHaveLength(13)
    expect(new Set(printed).size).toBe(printed.length)
    expect(MARKDOWN_TOOLBAR_ITEMS.every(item => item.shortcut.includes('mod'))).toBe(true)
  })

  it('announces a shortcut with the DOM modifier names aria-keyshortcuts wants', () => {
    expect(ariaKeyShortcuts(['mod', 'shift', 'X'])).toBe('Control+Shift+X')
    expect(ariaKeyShortcuts(['mod', 'B'])).toBe('Control+B')
  })

  it('takes either primary modifier, so ⌘B and Ctrl+B both mean Bold', () => {
    expect(markdownShortcutFor(keydown({ key: 'b', ctrlKey: true }))).toBe('bold')
    expect(markdownShortcutFor(keydown({ key: 'b', metaKey: true }))).toBe('bold')
  })

  it('reads digits off `code`, since Shift rewrites `key` to punctuation', () => {
    // Ctrl+Shift+8 arrives as key "*" on a US layout.
    const event = keydown({ key: '*', code: 'Digit8', ctrlKey: true, shiftKey: true })

    expect(markdownShortcutFor(event)).toBe('bulleted-list')
  })

  it('tells a shifted shortcut from its unshifted neighbour', () => {
    expect(markdownShortcutFor(keydown({ key: 'e', ctrlKey: true }))).toBe('inline-code')
    expect(markdownShortcutFor(keydown({ key: 'E', ctrlKey: true, shiftKey: true })))
      .toBe('code-block')
  })

  it('matches the link, which lives outside the groups', () => {
    expect(markdownShortcutFor(keydown({ key: 'k', ctrlKey: true }))).toBe('link')
  })

  it('ignores a bare keypress, and anything holding Alt', () => {
    expect(markdownShortcutFor(keydown({ key: 'b' }))).toBeUndefined()
    expect(markdownShortcutFor(keydown({ key: 'b', ctrlKey: true, altKey: true })))
      .toBeUndefined()
  })

  it('ignores a modifier combination nothing is bound to', () => {
    expect(markdownShortcutFor(keydown({ key: 'q', ctrlKey: true }))).toBeUndefined()
  })
})
