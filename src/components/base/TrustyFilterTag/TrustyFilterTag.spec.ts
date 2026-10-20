import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyFilterTag from './TrustyFilterTag.vue'

describe('trustyFilterTag', () => {
  it('renders the label inside a button', () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toContain('errors')
  })

  it('defaults to a blue chip that is off', () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors' } })
    const button = wrapper.get('button')
    expect(button.attributes('data-color')).toBe('blue')
    expect(button.attributes('aria-pressed')).toBe('false')
  })

  it('reflects the hue as data-color', () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors', color: 'magenta' } })
    expect(wrapper.get('button').attributes('data-color')).toBe('magenta')
  })

  it('carries no add/remove glyph — nothing here is destructive', () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors' } })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.get('button').attributes('data-action')).toBeUndefined()
  })

  it('toggles the model on click', async () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors', modelValue: false } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('announces the on state as aria-pressed', () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors', modelValue: true } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('names itself with its label — the chip is not an action', () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors' } })
    expect(wrapper.get('button').attributes('aria-label')).toBeUndefined()
  })

  it('lets a consumer override the accessible label', () => {
    const wrapper = mount(TrustyFilterTag, {
      props: { label: 'errors' },
      attrs: { 'aria-label': 'Show errors only' },
    })
    expect(wrapper.get('button').attributes('aria-label')).toBe('Show errors only')
  })

  it('disables the button and ignores the click', async () => {
    const wrapper = mount(TrustyFilterTag, { props: { label: 'errors', disabled: true } })
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
