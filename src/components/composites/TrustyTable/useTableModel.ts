/**
 * Everything TrustyTable decides, behind one call.
 *
 * The table's four concerns — selection, sorting, cell content, pagination — in one Vue-free module, so the tri-state checkbox, the all-or-nothing merge and the range arithmetic can be tested without mounting the component or reading rendered text out of the DOM.
 *
 * One module rather than a folder of pure helpers on purpose: the rules are not independently interesting, but how they combine is — a disabled row is out of `selectableKeys`, which is what makes `all` indeterminate, which is what `toggleAll` fills up towards. One call in, one model out.
 *
 * It takes getters and refs rather than the props object, so a test constructs it from plain `ref()`s with no component in sight.
 */

import type { ComputedRef, Ref } from 'vue'
import type { TrustyTableCell, TrustyTableColumn, TrustyTableRow, TrustyTableSort } from './TrustyTable.types'
import { computed } from 'vue'

export type TrustyTableKey = string | number

/** A cell resolved for rendering: the raw value for the slot, split for the default. */
export interface ResolvedCell {
  /** Exactly what the consumer put in `row.cells`, handed to the `cell-<key>` slot. */
  value: TrustyTableCell | undefined
  text: string | number | undefined
  description: string | undefined
}

export interface TableModelOptions {
  columns: () => TrustyTableColumn[]
  rows: () => TrustyTableRow[]
  selectable: () => boolean
  /** Rows across every page. `undefined` means the consumer isn't paging. */
  total: () => number | undefined
  itemsPerPage: () => number
  /** The three v-models, written through directly. */
  selected: Ref<TrustyTableKey[]>
  sort: Ref<TrustyTableSort | undefined>
  page: Ref<number>
}

export interface TableModel {
  isEmpty: ComputedRef<boolean>
  /** The empty state drops the checkbox column with the rows it would have picked. */
  showSelection: ComputedRef<boolean>
  /** Data columns plus the checkbox column, for the empty row's colspan. */
  columnCount: ComputedRef<number>
  selection: {
    /** Tri-state, for the header checkbox. */
    all: ComputedRef<boolean | 'indeterminate'>
    has: (row: TrustyTableRow) => boolean
    toggle: (row: TrustyTableRow, checked: boolean | 'indeterminate') => void
    toggleAll: (checked: boolean | 'indeterminate') => void
    /** How many rows are picked across every page, for the status line. */
    count: ComputedRef<number>
  }
  sorting: {
    toggle: (column: TrustyTableColumn) => void
    ariaFor: (column: TrustyTableColumn) => 'none' | 'ascending' | 'descending' | undefined
  }
  pagination: {
    showFooter: ComputedRef<boolean>
    showPagination: ComputedRef<boolean>
    /** "Showing {start}–{end} of {total}" — the slice currently on screen. */
    range: ComputedRef<{ start: number, end: number }>
  }
  cellAt: (row: TrustyTableRow, column: TrustyTableColumn) => ResolvedCell
}

export function useTableModel(options: TableModelOptions): TableModel {
  const { selected, sort, page } = options

  const isEmpty = computed(() => options.rows().length === 0)
  const showSelection = computed(() => options.selectable() && !isEmpty.value)
  const columnCount = computed(() => options.columns().length + (showSelection.value ? 1 : 0))

  // A disabled row can't be picked, so select-all ignores it entirely.
  const selectableKeys = computed(() =>
    options.rows().filter(row => !row.disabled).map(row => row.key))

  const all = computed<boolean | 'indeterminate'>(() => {
    const picked = selectableKeys.value.filter(key => selected.value.includes(key))
    if (picked.length === 0) {
      return false
    }
    return picked.length === selectableKeys.value.length ? true : 'indeterminate'
  })

  const pageCount = computed(() =>
    Math.ceil((options.total() ?? 0) / options.itemsPerPage()))

  const range = computed(() => {
    const rowCount = options.rows().length
    const start = rowCount === 0 ? 0 : (page.value - 1) * options.itemsPerPage() + 1
    // `start + rowCount - 1` goes NEGATIVE on an empty page, which the status line used to render literally as "Showing 0–-1 of 0". Clamped to `start`, an empty page reads "Showing 0–0 of 0".
    const end = Math.max(start, Math.min(start + rowCount - 1, options.total() ?? 0))
    return { start, end }
  })

  return {
    isEmpty,
    showSelection,
    columnCount,

    selection: {
      all,
      count: computed(() => selected.value.length),
      has: row => selected.value.includes(row.key),
      toggle(row, checked) {
        selected.value = checked === true
          ? [...selected.value, row.key]
          : selected.value.filter(key => key !== row.key)
      },
      // All-or-nothing: a partial selection fills up rather than emptying out. Only THIS page's keys are touched, so a selection made on page 1 survives paging to page 2 and back.
      toggleAll(checked) {
        const onPage = new Set(selectableKeys.value)
        selected.value = checked === true
          ? [...selected.value.filter(key => !onPage.has(key)), ...selectableKeys.value]
          : selected.value.filter(key => !onPage.has(key))
      },
    },

    sorting: {
      // A header flips between the two directions, and a column picked up for the first time starts ascending. There is deliberately no third "unsorted" click: it made going back to ascending cost two clicks, which reads as the control sticking. Clear a sort by setting the model to `undefined`.
      toggle(column) {
        const flip = sort.value?.key === column.key && sort.value.direction === 'asc'
        sort.value = { key: column.key, direction: flip ? 'desc' : 'asc' }
      },
      ariaFor(column) {
        if (!column.sortable) {
          return undefined
        }
        if (sort.value?.key !== column.key) {
          return 'none'
        }
        return sort.value.direction === 'asc' ? 'ascending' : 'descending'
      },
    },

    pagination: {
      showFooter: computed(() => options.total() !== undefined),
      showPagination: computed(() => pageCount.value > 1),
      range,
    },

    // One call per cell, not four: the template would otherwise invoke cellOf() once for the slot and three more times to pick the union apart.
    cellAt(row, column) {
      const value = row.cells[column.key]
      return typeof value === 'object'
        ? { value, text: value.text, description: value.description }
        : { value, text: value, description: undefined }
    },
  }
}
