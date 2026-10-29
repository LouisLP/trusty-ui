import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TagBase from './TagBase.vue'

describe('tagBase', () => {
  it('renders the label inside a button', () => {
    const wrapper = mount(TagBase, { props: { label: 'keyword' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toContain('keyword')
  })

  it('defaults to the mint hue', () => {
    const wrapper = mount(TagBase, { props: { label: 'keyword' } })
    expect(wrapper.get('button').attributes('data-color')).toBe('mint')
  })

  it('reflects the hue as data-color', () => {
    const wrapper = mount(TagBase, { props: { label: 'keyword', color: 'forest' } })
    expect(wrapper.get('button').attributes('data-color')).toBe('forest')
  })

  it('renders aria-pressed only when a wrapper opts into the toggle', () => {
    const plain = mount(TagBase, { props: { label: 'keyword' } })
    expect(plain.get('button').attributes('aria-pressed')).toBeUndefined()

    const off = mount(TagBase, { props: { label: 'keyword', pressed: false } })
    expect(off.get('button').attributes('aria-pressed')).toBe('false')

    const on = mount(TagBase, { props: { label: 'keyword', pressed: true } })
    expect(on.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('places the two glyph slots around the label', () => {
    const wrapper = mount(TagBase, {
      props: { label: 'keyword' },
      slots: { leading: '<i data-test="lead" />', trailing: '<i data-test="trail" />' },
    })
    expect(wrapper.get('button').html()).toMatch(/data-test="lead"[\s\S]*keyword[\s\S]*data-test="trail"/)
  })

  it('emits a click', async () => {
    const wrapper = mount(TagBase, { props: { label: 'keyword' } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('lets attrs land last, so a wrapper label wins', () => {
    const wrapper = mount(TagBase, {
      props: { label: 'keyword' },
      attrs: { 'aria-label': 'Remove keyword' },
    })
    expect(wrapper.get('button').attributes('aria-label')).toBe('Remove keyword')
  })

  it('disables the button', () => {
    const wrapper = mount(TagBase, { props: { label: 'keyword', disabled: true } })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
