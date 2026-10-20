/** One cell's content: plain text, or a title with a subtitle under it. */
export type TrustyTableCell = string | number | { text: string, description?: string }

export interface TrustyTableColumn {
  /** Identifies the column: keys a row's `cells`, and names its `cell-<key>` slot. */
  key: string
  /** Column heading, rendered in the header row. */
  label: string
  /** Which edge the column's content sits against. */
  align?: 'start' | 'end'
  /** `fill` shares out the leftover width; `hug` shrinks to its content. Give fixed-size columns (icons, action buttons) `hug` and leave at least one data column on `fill` so the table spans its container. */
  width?: 'fill' | 'hug'
  /** Offer this column's header as a sort control. */
  sortable?: boolean
}

export interface TrustyTableRow {
  /** Identifies the row — what selection reports and what keys the render. */
  key: string | number
  /** Greys the row out and takes it out of selection. */
  disabled?: boolean
  /** Cell content by column key. A missing key renders an empty cell. */
  cells: Record<string, TrustyTableCell>
}

export interface TrustyTableSort {
  /** The `key` of the column being sorted on. */
  key: string
  direction: 'asc' | 'desc'
}
