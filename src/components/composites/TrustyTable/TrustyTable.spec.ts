import type { TrustyTableColumn, TrustyTableRow } from './TrustyTable.types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyPagination from '../../base/TrustyPagination/TrustyPagination.vue'
import TrustyTable from './TrustyTable.vue'

const COLUMNS: TrustyTableColumn[] = [
  { key: 'operation', label: 'Operation', sortable: true },
  { key: 'entity', label: 'Entity' },
  { key: 'actions', label: 'Actions', width: 'hug', align: 'end' },
]

const ROWS: TrustyTableRow[] = [
  { key: 'a', cells: { operation: { text: 'Delete', description: '20 sec ago' }, entity: 'B-roll 014' } },
  { key: 'b', cells: { operation: 'Add', entity: 'Marker 002' } },
  { key: 'c', disabled: true, cells: { operation: 'Modify', entity: 'Title card' } },
]

function mountTable(props: Record<string, unknown> = {}) {
  return mount(TrustyTable, { props: { columns: COLUMNS, rows: ROWS, label: 'History', ...props } })
}

describe('trustyTable', () => {
  it('renders a header cell per column and a row per record', () => {
    const wrapper = mountTable()

    expect(wrapper.findAll('thead th').map(th => th.text())).toEqual(['Operation', 'Entity', 'Actions'])
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('names the table with a caption when given a label', () => {
    expect(mountTable().get('caption').text()).toBe('History')
  })

  it('renders no caption without a label', () => {
    const wrapper = mount(TrustyTable, { props: { columns: COLUMNS, rows: ROWS } })

    expect(wrapper.find('caption').exists()).toBe(false)
  })

  it('left-aligns headings with their column by default', () => {
    const wrapper = mountTable()
    const [first, , last] = wrapper.findAll('thead th')

    expect(first!.attributes('data-align')).toBe('start')
    expect(last!.attributes('data-align')).toBe('end')
  })

  it('renders a cell description under its text', () => {
    const cell = mountTable().get('tbody tr td')

    expect(cell.get('.trusty-table-text').text()).toBe('Delete')
    expect(cell.get('.trusty-table-description').text()).toBe('20 sec ago')
  })

  it('shows the empty label instead of rows, spanning every column', () => {
    const wrapper = mountTable({ rows: [], emptyLabel: 'Nothing here' })
    const empty = wrapper.get('.trusty-table-empty')

    expect(empty.text()).toBe('Nothing here')
    expect(empty.attributes('colspan')).toBe('3')
  })

  describe('selection', () => {
    it('adds no checkbox column unless asked', () => {
      expect(mountTable().find('.trusty-table-select').exists()).toBe(false)
    })

    it('emits the row key a checkbox picks', async () => {
      const wrapper = mountTable({ selectable: true, selected: [] })

      await wrapper.findAll('tbody [role="checkbox"]')[1]!.trigger('click')

      expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['b']])
    })

    it('drops the key again when the checkbox is cleared', async () => {
      const wrapper = mountTable({ selectable: true, selected: ['a', 'b'] })

      await wrapper.findAll('tbody [role="checkbox"]')[0]!.trigger('click')

      expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['b']])
    })

    it('leaves a disabled row out of select-all', async () => {
      const wrapper = mountTable({ selectable: true, selected: [] })

      await wrapper.get('thead [role="checkbox"]').trigger('click')

      expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['a', 'b']])
    })

    it('reads a partial selection as indeterminate', () => {
      const wrapper = mountTable({ selectable: true, selected: ['a'] })

      expect(wrapper.get('thead [role="checkbox"]').attributes('aria-checked')).toBe('mixed')
    })

    it('fills up from a partial selection rather than emptying out', async () => {
      const wrapper = mountTable({ selectable: true, selected: ['a'] })

      await wrapper.get('thead [role="checkbox"]').trigger('click')

      expect(wrapper.emitted('update:selected')?.at(-1)).toEqual([['a', 'b']])
    })

    it('hides the checkbox column while the table is empty', () => {
      const wrapper = mountTable({ selectable: true, rows: [] })

      expect(wrapper.find('.trusty-table-select').exists()).toBe(false)
      expect(wrapper.get('.trusty-table-empty').attributes('colspan')).toBe('3')
    })
  })

  describe('sorting', () => {
    it('offers a sort control only on sortable columns', () => {
      const wrapper = mountTable()

      expect(wrapper.findAll('.trusty-table-sort')).toHaveLength(1)
    })

    it('starts an unsorted column ascending', async () => {
      const wrapper = mountTable({ sort: undefined })

      await wrapper.get('.trusty-table-sort').trigger('click')

      expect(wrapper.emitted('update:sort')?.at(-1)).toEqual([{ key: 'operation', direction: 'asc' }])
    })

    it('flips between the two directions on one click each way', async () => {
      const wrapper = mountTable({ sort: { key: 'operation', direction: 'asc' } })
      const control = wrapper.get('.trusty-table-sort')

      await control.trigger('click')
      expect(wrapper.emitted('update:sort')?.at(-1)).toEqual([{ key: 'operation', direction: 'desc' }])

      // Descending back to ascending is one click too — never two via unsorted.
      await wrapper.setProps({ sort: { key: 'operation', direction: 'desc' } })
      await control.trigger('click')
      expect(wrapper.emitted('update:sort')?.at(-1)).toEqual([{ key: 'operation', direction: 'asc' }])
    })

    it('starts ascending again when the sort moves to another column', async () => {
      const wrapper = mount(TrustyTable, {
        props: {
          columns: [{ key: 'operation', label: 'Operation', sortable: true }, { key: 'entity', label: 'Entity', sortable: true }],
          rows: ROWS,
          sort: { key: 'operation', direction: 'desc' },
        },
      })

      await wrapper.findAll('.trusty-table-sort')[1]!.trigger('click')

      expect(wrapper.emitted('update:sort')?.at(-1)).toEqual([{ key: 'entity', direction: 'asc' }])
    })

    it('reports the sorted column through aria-sort', async () => {
      const wrapper = mountTable({ sort: { key: 'operation', direction: 'desc' } })

      expect(wrapper.findAll('thead th')[0]!.attributes('aria-sort')).toBe('descending')
      expect(wrapper.findAll('thead th')[1]!.attributes('aria-sort')).toBeUndefined()
    })

    it('never reorders the rows itself', () => {
      const wrapper = mountTable({ sort: { key: 'operation', direction: 'desc' } })

      const firstColumn = wrapper.findAll('tbody tr').map(row => row.get('.trusty-table-text').text())

      expect(firstColumn).toEqual(['Delete', 'Add', 'Modify'])
    })
  })

  describe('footer', () => {
    it('stays away until a total is given', () => {
      expect(mountTable().find('.trusty-table-footer').exists()).toBe(false)
    })

    it('reports the slice of the collection on screen', () => {
      const wrapper = mountTable({ total: 130, itemsPerPage: 3, page: 2 })

      expect(wrapper.get('.trusty-table-status').text()).toBe('Showing 4–6 of 130')
    })

    it('reports the selection count instead once rows are picked', () => {
      const wrapper = mountTable({ total: 130, itemsPerPage: 3, selectable: true, selected: ['a', 'b'] })

      expect(wrapper.get('.trusty-table-status').text()).toBe('2 of 130 rows selected')
    })

    it('paginates only past the first page of results', () => {
      expect(mountTable({ total: 3, itemsPerPage: 3 }).findComponent(TrustyPagination).exists()).toBe(false)
      expect(mountTable({ total: 130, itemsPerPage: 3 }).findComponent(TrustyPagination).exists()).toBe(true)
    })

    it('emits the page the footer asks for', async () => {
      const wrapper = mountTable({ total: 130, itemsPerPage: 3, page: 1 })

      await wrapper.get('[aria-label="Next Page"]').trigger('click')

      expect(wrapper.emitted('update:page')?.at(-1)).toEqual([2])
    })
  })

  it('hands a cell over to its column slot', () => {
    const wrapper = mount(TrustyTable, {
      props: { columns: COLUMNS, rows: ROWS, label: 'History' },
      slots: { 'cell-actions': '<button>Undo {{ params.row.key }}</button>' },
    })

    expect(wrapper.findAll('tbody button').map(b => b.text())).toEqual(['Undo a', 'Undo b', 'Undo c'])
  })
})
