import type { TrustyTreeDropPosition, TrustyTreeItem, TrustyTreeMove } from './TrustyTree.types'

/** Every decision about where a row goes — from a pointer, from a keyboard, or from a caller applying a move itself. All of it is pure over the tree and a couple of numbers, so all of it is testable without rendering a tree. */

/** Path from the roots down to `id`, `id`'s own row last. */
export function treeItemPath(items: TrustyTreeItem[], id: string): TrustyTreeItem[] | undefined {
  for (const item of items) {
    if (item.id === id)
      return [item]
    const rest = item.children && treeItemPath(item.children, id)
    if (rest)
      return [item, ...rest]
  }
  return undefined
}

/** A row nests children only if it already models them — an empty array counts. */
function treeItemAcceptsChildren(item: TrustyTreeItem): boolean {
  return item.children !== undefined
}

/** A row, the sibling list holding it, and its index in that list. */
interface Located {
  list: TrustyTreeItem[]
  index: number
  item: TrustyTreeItem
}

/** Depth-first lookup of `id`, reporting the sibling list it sits in. Derived from `treeItemPath` rather than walking the tree a second time for the same search. */
function locate(items: TrustyTreeItem[], id: string): Located | undefined {
  const path = treeItemPath(items, id)
  if (!path)
    return undefined
  const item = path.at(-1)!
  const list = path.at(-2)?.children ?? items
  return { list, index: list.findIndex(sibling => sibling.id === id), item }
}

/** Every id in `item`'s subtree, `item`'s own id first. */
export function treeItemSubtreeIds(item: TrustyTreeItem): string[] {
  return [item.id, ...(item.children?.flatMap(treeItemSubtreeIds) ?? [])]
}

/** Fresh objects and fresh `children` arrays all the way down. */
function cloneTree(items: TrustyTreeItem[]): TrustyTreeItem[] {
  return items.map(item => item.children
    ? { ...item, children: cloneTree(item.children) }
    : { ...item })
}

/**
 * `items` with the row `move.id` relocated next to (or inside) `move.targetId`.
 *
 * Pure: the input tree is never mutated, and an impossible move — an unknown id, a row dropped on itself, or a row dropped into its own subtree — returns `items` unchanged. `<TrustyTree>` applies this itself for `v-model:items`; call it directly when you own the tree data instead.
 */
export function moveTreeItem(items: TrustyTreeItem[], move: TrustyTreeMove): TrustyTreeItem[] {
  const { id, targetId, position } = move
  if (id === targetId)
    return items

  const source = locate(items, id)
  if (!source || treeItemSubtreeIds(source.item).includes(targetId))
    return items
  if (!locate(items, targetId))
    return items

  const next = cloneTree(items)
  const from = locate(next, id)!
  const [moved] = from.list.splice(from.index, 1)
  const to = locate(next, targetId)!

  if (position === 'inside')
    to.item.children = [...(to.item.children ?? []), moved!]
  else
    to.list.splice(position === 'after' ? to.index + 1 : to.index, 0, moved!)

  return next
}

/**
 * Where a drop lands on a row, from the pointer's position within it: the top quarter drops before, the bottom quarter after, and the middle nests. A row that cannot take children splits in half instead, because there is no middle for it to mean.
 *
 * Takes the measured box rather than the `DragEvent` it came from, so it is arithmetic and not an event handler — a test reaches these thresholds with plain numbers.
 */
export function treeDropPosition(
  item: TrustyTreeItem,
  bounds: { top: number, height: number },
  pointerY: number,
): TrustyTreeDropPosition {
  const ratio = bounds.height ? (pointerY - bounds.top) / bounds.height : 0
  if (!treeItemAcceptsChildren(item))
    return ratio < 0.5 ? 'before' : 'after'
  if (ratio < 0.25)
    return 'before'
  return ratio > 0.75 ? 'after' : 'inside'
}

/**
 * The move a Ctrl/⌘ + Shift + arrow asks for, or undefined when there is none to make: ↑/↓ reorder among siblings, ← lifts the row out to its parent's level, → nests it into the sibling above (which has to be able to take it).
 *
 * The edges are the point — the first row has no previous sibling, the last has no next, a root row has no parent to lift out to — and each of them means "do nothing" rather than "do something strange".
 */
export function treeMoveForKey(
  key: string,
  items: TrustyTreeItem[],
  id: string,
): TrustyTreeMove | undefined {
  const path = treeItemPath(items, id)
  if (!path)
    return undefined

  const parent = path.at(-2)
  const list = parent?.children ?? items
  const index = list.findIndex(sibling => sibling.id === id)
  const previous = list[index - 1]
  const next = list[index + 1]

  if (key === 'ArrowUp' && previous)
    return { id, targetId: previous.id, position: 'before' }
  if (key === 'ArrowDown' && next)
    return { id, targetId: next.id, position: 'after' }
  if (key === 'ArrowLeft' && parent)
    return { id, targetId: parent.id, position: 'after' }
  if (key === 'ArrowRight' && previous && treeItemAcceptsChildren(previous))
    return { id, targetId: previous.id, position: 'inside' }
  return undefined
}
