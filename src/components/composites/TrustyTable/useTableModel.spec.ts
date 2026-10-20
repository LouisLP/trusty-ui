import type { TrustyTableColumn, TrustyTableRow, TrustyTableSort } from './TrustyTable.types'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTableModel } from './useTableModel'

// No mount anywhere in this file: every rule here is asserted against the model it returns rather than through rendered text and attributes.

const NAME: TrustyTableColumn = { key: 'name', label: 'Name', sortable: true }
const ROLE: TrustyTableColumn = { key: 'role', label: 'Role' }
const COLUMNS: TrustyTableColumn[] = [NAME, ROLE]

function rowOf(key: string): TrustyTableRow {
  return { key, cells: { name: key, role: 'Engineer' } }
}

function rowsOf(...keys: (string | { key: string, disabled: boolean })[]): TrustyTableRow[] {
  return keys.map((entry) => {
    const key = typeof entry === 'string' ? entry : entry.key
    return {
      key,
      disabled: typeof entry === 'string' ? undefined : entry.disabled,
      cells: { name: key, role: 'Engineer' },
    }
  })
}

function model(overrides: {
  rows?: TrustyTableRow[]
  columns?: TrustyTableColumn[]
  selectable?: boolean
  total?: number
  itemsPerPage?: number
  selected?: (string | number)[]
  sort?: TrustyTableSort
  page?: number
} = {}) {
  const selected = ref<(string | number)[]>(overrides.selected ?? [])
  const sort = ref<TrustyTableSort | undefined>(overrides.sort)
  const page = ref(overrides.page ?? 1)
  const table = useTableModel({
    columns: () => overrides.columns ?? COLUMNS,
    rows: () => overrides.rows ?? rowsOf('a', 'b', 'c'),
    selectable: () => overrides.selectable ?? true,
    total: () => overrides.total,
    itemsPerPage: () => overrides.itemsPerPage ?? 10,
    selected,
    sort,
    page,
  })
  return { table, selected, sort, page }
}

describe('selection', () => {
  it('is unselected when nothing is picked', () => {
    expect(model().table.selection.all.value).toBe(false)
  })

  it('is indeterminate when some of the page is picked', () => {
    expect(model({ selected: ['a'] }).table.selection.all.value).toBe('indeterminate')
  })

  it('is fully selected when every selectable row is picked', () => {
    expect(model({ selected: ['a', 'b', 'c'] }).table.selection.all.value).toBe(true)
  })

  it('ignores disabled rows entirely, so they cannot hold it indeterminate', () => {
    const { table } = model({
      rows: rowsOf('a', 'b', { key: 'c', disabled: true }),
      selected: ['a', 'b'],
    })
    expect(table.selection.all.value).toBe(true)
  })

  it('never picks a disabled row through select-all', () => {
    const { table, selected } = model({ rows: rowsOf('a', { key: 'b', disabled: true }) })
    table.selection.toggleAll(true)
    expect(selected.value).toEqual(['a'])
  })

  it('fills a partial selection up rather than emptying it out', () => {
    const { table, selected } = model({ selected: ['a'] })
    table.selection.toggleAll(true)
    expect([...selected.value].sort()).toEqual(['a', 'b', 'c'])
  })

  it('keeps selections made on other pages when selecting all of this one', () => {
    // The merge that makes selection outlive a page change: only this page's keys are touched, so `off-page` survives untouched and un-duplicated.
    const { table, selected } = model({ selected: ['off-page', 'a'] })
    table.selection.toggleAll(true)
    expect(selected.value).toContain('off-page')
    expect(selected.value.filter(key => key === 'a')).toHaveLength(1)
  })

  it('clears only this page when deselecting all', () => {
    const { table, selected } = model({ selected: ['off-page', 'a', 'b'] })
    table.selection.toggleAll(false)
    expect(selected.value).toEqual(['off-page'])
  })

  it('toggles one row without disturbing the rest', () => {
    const { table, selected } = model({ selected: ['a'] })
    table.selection.toggle(rowOf('b'), true)
    expect(selected.value).toEqual(['a', 'b'])
    table.selection.toggle(rowOf('a'), false)
    expect(selected.value).toEqual(['b'])
  })
})

describe('sorting', () => {
  it('starts a newly picked column ascending', () => {
    const { table, sort } = model()
    table.sorting.toggle(NAME)
    expect(sort.value).toEqual({ key: 'name', direction: 'asc' })
  })

  it('flips between the two directions, with no third unsorted click', () => {
    // Deliberate: a third state made going back to ascending cost two clicks.
    const { table, sort } = model({ sort: { key: 'name', direction: 'asc' } })
    table.sorting.toggle(NAME)
    expect(sort.value).toEqual({ key: 'name', direction: 'desc' })
    table.sorting.toggle(NAME)
    expect(sort.value).toEqual({ key: 'name', direction: 'asc' })
  })

  it('restarts ascending when the sort moves to another column', () => {
    const { table, sort } = model({ sort: { key: 'role', direction: 'desc' } })
    table.sorting.toggle(NAME)
    expect(sort.value).toEqual({ key: 'name', direction: 'asc' })
  })

  it('reports aria-sort only for sortable columns', () => {
    const { table } = model({ sort: { key: 'name', direction: 'desc' } })
    expect(table.sorting.ariaFor(NAME)).toBe('descending')
    expect(table.sorting.ariaFor(ROLE)).toBeUndefined()
  })

  it('reports none for a sortable column that is not the sorted one', () => {
    expect(model().table.sorting.ariaFor(NAME)).toBe('none')
  })
})

describe('cells', () => {
  it('reads a plain value as its own text', () => {
    const row: TrustyTableRow = { key: 'a', cells: { name: 'Ada' } }
    expect(model().table.cellAt(row, NAME)).toEqual({
      value: 'Ada',
      text: 'Ada',
      description: undefined,
    })
  })

  it('splits a text/description cell, and hands the slot the raw value', () => {
    const value = { text: 'Ada', description: 'Analyst' }
    const row: TrustyTableRow = { key: 'a', cells: { name: value } }
    expect(model().table.cellAt(row, NAME)).toEqual({
      value,
      text: 'Ada',
      description: 'Analyst',
    })
  })

  it('resolves a missing key to an empty cell rather than throwing', () => {
    const row: TrustyTableRow = { key: 'a', cells: {} }
    expect(model().table.cellAt(row, NAME).text).toBeUndefined()
  })
})

describe('pagination', () => {
  it('shows the footer only once a total is given', () => {
    expect(model().table.pagination.showFooter.value).toBe(false)
    expect(model({ total: 3 }).table.pagination.showFooter.value).toBe(true)
  })

  it('shows pagination only past the first page of results', () => {
    expect(model({ total: 3, itemsPerPage: 10 }).table.pagination.showPagination.value).toBe(false)
    expect(model({ total: 30, itemsPerPage: 10 }).table.pagination.showPagination.value).toBe(true)
  })

  it('reports the slice on screen, 1-based', () => {
    const { table } = model({ rows: rowsOf('a', 'b', 'c'), total: 30, itemsPerPage: 3, page: 2 })
    expect(table.pagination.range.value).toEqual({ start: 4, end: 6 })
  })

  it('does not run the last page past the total', () => {
    // A final page holding two of a possible ten still ends at the total.
    const { table } = model({ rows: rowsOf('a', 'b'), total: 12, itemsPerPage: 5, page: 3 })
    expect(table.pagination.range.value).toEqual({ start: 11, end: 12 })
  })

  it('reports an empty range when there are no rows', () => {
    const { table } = model({ rows: [], total: 0, itemsPerPage: 10 })
    expect(table.pagination.range.value).toEqual({ start: 0, end: 0 })
  })
})

describe('layout', () => {
  it('drops the checkbox column with the rows, when empty', () => {
    const { table } = model({ rows: [] })
    expect(table.isEmpty.value).toBe(true)
    expect(table.showSelection.value).toBe(false)
    // So the empty row spans the data columns only.
    expect(table.columnCount.value).toBe(2)
  })

  it('counts the checkbox column while there are rows to pick', () => {
    expect(model().table.columnCount.value).toBe(3)
  })

  it('never shows selection when the table is not selectable', () => {
    expect(model({ selectable: false }).table.showSelection.value).toBe(false)
  })
})
