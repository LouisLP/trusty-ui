import { describe, expect, it } from 'vitest'
import { MARKDOWN_TOOLBAR_GROUPS } from './MarkdownToolbar.actions'
import {
  COLLAPSE_ORDER,
  collapsedGroups,
  collapseLevelFor,
  FALLBACK_WIDTHS,
  visibleGroups,
  widthsFromLayout,
} from './MarkdownToolbar.responsive'

describe('markdownToolbar responsive', () => {
  it('folds every group except emphasis, which is what the bar is for', () => {
    const foldable = new Set<string>(COLLAPSE_ORDER)
    const names = MARKDOWN_TOOLBAR_GROUPS.map(group => group.name)

    expect(names.filter(name => !foldable.has(name))).toEqual(['Emphasis'])
  })

  it('needs less room at each level, and never fewer groups than it folded', () => {
    expect(FALLBACK_WIDTHS).toHaveLength(COLLAPSE_ORDER.length + 1)
    expect([...FALLBACK_WIDTHS].sort((a, b) => b - a)).toEqual(FALLBACK_WIDTHS)
  })

  it('shows everything at the width the design draws the bar at', () => {
    expect(collapseLevelFor(602)).toBe(0)
    expect(collapsedGroups(0)).toEqual([])
    expect(visibleGroups(0)).toEqual(MARKDOWN_TOOLBAR_GROUPS)
  })

  it('folds exactly one more group at each threshold', () => {
    FALLBACK_WIDTHS.forEach((width: number, level: number) => {
      expect(collapseLevelFor(width)).toBe(level)
      expect(collapsedGroups(level)).toHaveLength(level)
      expect(visibleGroups(level)).toHaveLength(MARKDOWN_TOOLBAR_GROUPS.length - level)
    })
  })

  it('folds one group as soon as the bar is a pixel too narrow for all of them', () => {
    expect(collapseLevelFor(FALLBACK_WIDTHS[0]! - 1)).toBe(1)
    expect(collapsedGroups(1).map(group => group.name)).toEqual(['Blocks'])
  })

  it('prefers measured thresholds, so a stylesheet the fallback disagrees with still folds', () => {
    // The bug this replaced: constants copied out of the stylesheet said the bar fitted, the browser disagreed, and it grew a second row instead.
    const measured = widthsFromLayout({
      total: 800,
      removalCost: { Blocks: 100, Headings: 100, Lists: 100 },
      overflowCost: 30,
    })

    expect(measured).toEqual([800, 730, 630, 530])
    expect(collapseLevelFor(760, measured)).toBe(1)
    // The same width against the fallback would have folded nothing.
    expect(collapseLevelFor(760)).toBe(0)
  })

  it('stops folding once only emphasis and the link are left', () => {
    expect(collapseLevelFor(0)).toBe(COLLAPSE_ORDER.length)
    expect(visibleGroups(COLLAPSE_ORDER.length).map(group => group.name)).toEqual(['Emphasis'])
  })

  it('lists the folded groups in the bar\'s order, so headings head the menu', () => {
    // Blocks folds first, but the menu is the bar's continuation: headings sit above blocks there exactly as they do on the bar.
    expect(collapsedGroups(2).map(group => group.name)).toEqual(['Headings', 'Blocks'])
    expect(collapsedGroups(COLLAPSE_ORDER.length).map(group => group.name))
      .toEqual(['Headings', 'Blocks', 'Lists'])
  })

  it('folds in least-essential-first order', () => {
    expect([...COLLAPSE_ORDER]).toEqual(['Blocks', 'Headings', 'Lists'])
  })
})
