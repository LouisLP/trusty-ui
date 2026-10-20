import type { MarkdownToolbarGroup } from './MarkdownToolbar.actions'
import { MARKDOWN_TOOLBAR_GROUPS } from './MarkdownToolbar.actions'

/* The width maths behind the bar's collapsing, and the one function that reads the real numbers off the DOM. `useToolbarCollapse` is what a component uses; this half is kept separate because it is Vue-free and can therefore be tested without one. */

/** Which groups fold into the overflow menu first, least essential first. */
export const COLLAPSE_ORDER = ['Blocks', 'Headings', 'Lists'] as const

/** The rendered widths the bar is built from, in px. */
const ITEM_PX = 24 // --size-control-sm
const OVERLAP_PX = 2 // --border-md: adjacent borders collapse into one
const GAP_PX = 4 // --space-xs, between the bar's children
const SEPARATOR_PX = 5 // 1px rule + --space-2xs either side
const PADDING_PX = 16 // --space-sm at either end

/** A run of `count` segments whose borders collapse into each other. */
function runWidth(count: number): number {
  return count * ITEM_PX - (count - 1) * OVERLAP_PX
}

/** The link rides flush on the end of the emphasis run rather than alone. */
function groupWidth(group: MarkdownToolbarGroup): number {
  return runWidth(group.items.length + (group.name === 'Emphasis' ? 1 : 0))
}

/** How wide the bar must be to show `groups`, plus the overflow button if shown. */
function widthNeeded(groups: MarkdownToolbarGroup[], withOverflow: boolean): number {
  const runs = groups.reduce((total, group) => total + groupWidth(group), 0)
  const children = groups.length + (withOverflow ? 1 : 0)

  return PADDING_PX
    + runs
    + Math.max(0, groups.length - 1) * SEPARATOR_PX
    + Math.max(0, children - 1) * GAP_PX
    + (withOverflow ? ITEM_PX : 0)
}

/** The groups still on the bar once `level` of them have folded away. */
export function visibleGroups(level: number): MarkdownToolbarGroup[] {
  const folded = new Set<string>(COLLAPSE_ORDER.slice(0, level))
  return MARKDOWN_TOOLBAR_GROUPS.filter(group => !folded.has(group.name))
}

/** The groups in the overflow menu at `level`, in the bar's own order rather than the order they folded — the menu is where the bar continues, so headings sit above blocks there exactly as they do on the bar, even though blocks folded first. */
export function collapsedGroups(level: number): MarkdownToolbarGroup[] {
  const folded = new Set<string>(COLLAPSE_ORDER.slice(0, level))
  return MARKDOWN_TOOLBAR_GROUPS.filter(group => folded.has(group.name))
}

/** The width each collapse level needs, widest (nothing folded) first. Level 0 shows no overflow button, so it is the only one that does not pay for it. */
export const FALLBACK_WIDTHS: number[] = [
  widthNeeded(visibleGroups(0), false),
  ...COLLAPSE_ORDER.map((_, index) => widthNeeded(visibleGroups(index + 1), true)),
]

/** What the bar's own layout says it costs, read off the rendered DOM. */
export interface ToolbarLayout {
  /** Width of the whole bar at level 0, padding included. */
  total: number
  /** Width freed by folding a group away: the group plus the rule beside it. */
  removalCost: Record<string, number>
  /** Width the overflow button adds once anything has folded, gap included. */
  overflowCost: number
}

/** The same thresholds as `FALLBACK_WIDTHS`, but measured: each level starts from the full bar, gives back what its folded groups cost, and pays once for the overflow button that replaces them. */
export function widthsFromLayout(layout: ToolbarLayout): number[] {
  let width = layout.total

  return [
    width,
    ...COLLAPSE_ORDER.map((name) => {
      width -= layout.removalCost[name] ?? 0
      return width + layout.overflowCost
    }),
  ]
}

/** How many groups have to fold for the bar to fit in `width`. Below the last threshold emphasis and the link stay, and the bar overflows rather than growing a second row. */
export function collapseLevelFor(width: number, widths: number[] = FALLBACK_WIDTHS): number {
  const fits = widths.findIndex(needed => width >= needed)
  return fits === -1 ? COLLAPSE_ORDER.length : fits
}

/**
 * Read the level-0 layout off a rendered bar: how wide the whole thing is, and what each foldable group costs to remove.
 *
 * The adapter at the measurement seam, and the reason the seam exists: inside the SFC this could not be tested at all, since jsdom's ResizeObserver is a no-op stub, and a wrong answer here silently falls back to the hand-copied FALLBACK_WIDTHS.
 *
 * Returns undefined when the bar is not measurable yet, which the caller reads as "use the fallback".
 */
export function readToolbarLayout(bar: HTMLElement): ToolbarLayout | undefined {
  const groups = [...bar.querySelectorAll<HTMLElement>('[data-toolbar-group]')]
  const first = groups.at(0)?.getBoundingClientRect()
  const last = groups.at(-1)?.getBoundingClientRect()
  if (groups.length !== MARKDOWN_TOOLBAR_GROUPS.length || !first || !last || !last.width) {
    return undefined
  }

  const style = getComputedStyle(bar)
  const padding = Number.parseFloat(style.paddingInlineStart)
    + Number.parseFloat(style.paddingInlineEnd)
  const gap = Number.parseFloat(style.columnGap) || 0
  const item = bar.querySelector<HTMLElement>('.markdown-toolbar-item')

  const rects = groups.map(group => group.getBoundingClientRect())
  const removalCost: Record<string, number> = {}
  groups.forEach((group, index) => {
    const name = group.dataset.toolbarGroup
    const rect = rects[index]!
    // The whitespace on whichever side has a neighbour.
    const beside = index < rects.length - 1
      ? rects[index + 1]!.left - rect.right
      : rect.left - rects[index - 1]!.right
    if (name && COLLAPSE_ORDER.includes(name as typeof COLLAPSE_ORDER[number])) {
      removalCost[name] = rect.width + beside
    }
  })

  return {
    total: last.right - first.left + padding,
    removalCost,
    overflowCost: (item?.getBoundingClientRect().width ?? 0) + gap,
  }
}
