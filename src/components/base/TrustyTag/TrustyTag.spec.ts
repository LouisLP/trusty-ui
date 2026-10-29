import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyTag from './TrustyTag.vue'

describe('trustyTag', () => {
  it('renders the label inside a button', () => {
    const wrapper = mount(TrustyTag, { props: { label: 'keyword' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toContain('keyword')
  })

  it('defaults to a mint remove tag', () => {
    const wrapper = mount(TrustyTag, { props: { label: 'keyword' } })
    const button = wrapper.get('button')
    expect(button.attributes('data-color')).toBe('mint')
    expect(button.attributes('data-action')).toBe('remove')
  })

  it('reflects the hue as data-color', () => {
    const wrapper = mount(TrustyTag, { props: { label: 'keyword', color: 'magenta' } })
    expect(wrapper.get('button').attributes('data-color')).toBe('magenta')
  })

  it('names the action in the accessible label', () => {
    const remove = mount(TrustyTag, { props: { label: 'keyword' } })
    expect(remove.get('button').attributes('aria-label')).toBe('Remove keyword')

    const add = mount(TrustyTag, { props: { label: 'keyword', action: 'add' } })
    expect(add.get('button').attributes('aria-label')).toBe('Add keyword')
  })

  it('lets a consumer override the accessible label', () => {
    const wrapper = mount(TrustyTag, {
      props: { label: 'keyword' },
      attrs: { 'aria-label': 'Drop this keyword' },
    })
    expect(wrapper.get('button').attributes('aria-label')).toBe('Drop this keyword')
  })

  it('emits a click', async () => {
    const wrapper = mount(TrustyTag, { props: { label: 'keyword' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('is a plain button, never a toggle — TrustyFilterTag owns that', () => {
    const wrapper = mount(TrustyTag, { props: { label: 'keyword' } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBeUndefined()
  })

  it('shows one glyph, never both', () => {
    const remove = mount(TrustyTag, { props: { label: 'keyword' } })
    expect(remove.findAll('svg')).toHaveLength(1)

    const add = mount(TrustyTag, { props: { label: 'keyword', action: 'add' } })
    expect(add.findAll('svg')).toHaveLength(1)
  })

  it('disables the button', () => {
    const wrapper = mount(TrustyTag, { props: { label: 'keyword', disabled: true } })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
