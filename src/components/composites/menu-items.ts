import type { TrustyIconName } from '../../icons'
import type { TrustyKeyboardKey } from '../base/TrustyKeyboardBadge/TrustyKeyboardBadge.keys'

/** One row of a Trusty menu — shared by `TrustyDropdownMenu` and `TrustyContextMenu` so both accept the exact same `items` shape. */
export type TrustyMenuItem
  = | {
    /** Selectable action row (the default when `type` is omitted). */
    type?: 'item'
    /** Value reported by the `select` event when this row is chosen. */
    value: string
    /** Visible text. */
    label: string
    /** Optional leading icon (Iconify `collection:icon`, e.g. `ph:gear`). */
    icon?: TrustyIconName
    /** Optional keyboard-shortcut hint, one entry per key (rendered with `TrustyKeyboardBadge` — named special keys become glyphs). Purely visual — the menu never listens for the keys; the consumer owns the actual key handling. */
    shortcut?: TrustyKeyboardKey[]
    /** Disable just THIS row. */
    disabled?: boolean
    /** `danger` paints the row as a destructive action. */
    variant?: 'default' | 'danger'
  }
  | {
    /** Row that opens a nested submenu on hover (or `ArrowRight` / `Enter` from the keyboard). Not selectable itself — it never emits `select`; its children do. */
    type: 'submenu'
    /** Visible text. */
    label: string
    /** Optional leading icon (Iconify `collection:icon`, e.g. `ph:gear`). The trailing submenu marker is the component's, not yours. */
    icon?: TrustyIconName
    /** Disable the row, and with it the whole branch below it. */
    disabled?: boolean
    /** The submenu's own rows — the same shape again, so nesting has no fixed depth. Keep it to one level unless the design says otherwise: a submenu hides its contents until hovered. */
    children: TrustyMenuItem[]
  }
  | { type: 'separator' }
  | { type: 'label', label: string }
