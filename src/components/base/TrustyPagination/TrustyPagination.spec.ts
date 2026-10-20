import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyPagination from './TrustyPagination.vue'

/** The page buttons, in render order, as their visible text. */
function pageLabels(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('[data-type="page"]').map(button => button.text())
}

describe('trustyPagination', () => {
  it('derives the page count from total and itemsPerPage', () => {
    const wrapper = mount(TrustyPagination, { props: { total: 30, itemsPerPage: 10 } })

    expect(pageLabels(wrapper)).toEqual(['1', '2', '3'])
  })

  it('marks the current page', () => {
    const wrapper = mount(TrustyPagination, { props: { total: 30, itemsPerPage: 10, page: 2 } })
    const current = wrapper.get('[aria-current="page"]')

    expect(current.text()).toBe('2')
    expect(current.attributes('data-selected')).toBe('true')
  })

  it('emits the page a number button asks for', async () => {
    const wrapper = mount(TrustyPagination, { props: { total: 30, itemsPerPage: 10, page: 1 } })

    await wrapper.findAll('[data-type="page"]')[2]!.trigger('click')

    expect(wrapper.emitted('update:page')?.at(-1)).toEqual([3])
  })

  it('collapses the middle into ellipses and keeps the edges pinned', () => {
    const wrapper = mount(TrustyPagination, {
      props: { total: 990, itemsPerPage: 10, page: 5, siblingCount: 1 },
    })

    expect(pageLabels(wrapper)).toEqual(['1', '4', '5', '6', '99'])
    expect(wrapper.findAll('[data-type="ellipsis"]')).toHaveLength(2)
  })

  it('disables the backward controls on the first page', () => {
    const wrapper = mount(TrustyPagination, { props: { total: 30, itemsPerPage: 10, page: 1 } })

    expect(wrapper.get('[aria-label="First Page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[aria-label="Previous Page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[aria-label="Next Page"]').attributes('disabled')).toBeUndefined()
  })

  it('disables the forward controls on the last page', () => {
    const wrapper = mount(TrustyPagination, { props: { total: 30, itemsPerPage: 10, page: 3 } })

    expect(wrapper.get('[aria-label="Next Page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[aria-label="Last Page"]').attributes('disabled')).toBeDefined()
  })

  it('drops the jump-to-end arrows when edges are off', () => {
    const wrapper = mount(TrustyPagination, {
      props: { total: 30, itemsPerPage: 10, showEdges: false },
    })

    expect(wrapper.find('[aria-label="First Page"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Last Page"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Previous Page"]').exists()).toBe(true)
  })

  it('takes no page change while disabled', async () => {
    const wrapper = mount(TrustyPagination, {
      props: { total: 30, itemsPerPage: 10, page: 1, disabled: true },
    })

    await wrapper.findAll('[data-type="page"]')[1]!.trigger('click')

    expect(wrapper.emitted('update:page')).toBeUndefined()
  })

  it('renders as a navigation landmark', () => {
    const wrapper = mount(TrustyPagination, { props: { total: 30 } })

    expect(wrapper.element.tagName).toBe('NAV')
  })
})
