import type { TrustyIconName } from '../../../icons'
import type { TrustyTagColor } from '../TrustyTag/TrustyTag.types'

/** Hue of a color tag shown at the end of a tree row. The same seven hues `<TrustyTag>` paints. */
export type TrustyTreeTagColor = TrustyTagColor

/** One node of an `<TrustyTree>`, nested through `children`. */
export interface TrustyTreeItem {
  /** Unique id — what `v-model` (selection) and `v-model:expanded` report */
  id: string
  /** Row text */
  label: string
  /** Iconify name (`ph:file`). Parents show it bare, falling back to `ph:folder` / `ph:folder-open`; leaves show it inside the mint chip, or render label-only without one. */
  icon?: TrustyIconName
  /** Color tags shown right-aligned at the end of the row, in order */
  tags?: TrustyTreeTagColor[]
  /** Disable just this row (still focusable, never selects or toggles) */
  disabled?: boolean
  /** Child rows — their presence makes this row an expandable parent */
  children?: TrustyTreeItem[]
}

/** Where a dragged row lands relative to the row it was dropped on. `inside` appends it to that row's `children`, and only rows that already carry a `children` array (an empty one counts) accept it. */
export type TrustyTreeDropPosition = 'before' | 'after' | 'inside'

/** One completed reorder, as reported by `<TrustyTree>`'s `move` event. */
export interface TrustyTreeMove {
  /** id of the row that was dragged */
  id: string
  /** id of the row it was dropped on */
  targetId: string
  /** where it lands relative to `targetId` */
  position: TrustyTreeDropPosition
}
