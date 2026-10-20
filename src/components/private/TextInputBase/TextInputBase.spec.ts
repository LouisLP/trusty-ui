import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TextInputBase from './TextInputBase.vue'

// Private primitive; the public wrappers (TrustyTextInput, TrustySearchInput) cover the widget behaviour end-to-end. These tests pin the shell + slot contract the wrappers rely on.
describe('textInputBase', () => {
  it('renders a text input by default', () => {
    const wrapper = mount(TextInputBase)
    expect(wrapper.get('input').attributes('type')).toBe('text')
  })

  it('honours the type prop', () => {
    const wrapper = mount(TextInputBase, { props: { type: 'search' } })
    expect(wrapper.get('input').attributes('type')).toBe('search')
  })

  it('reflects the initial v-model value and emits on input', async () => {
    const wrapper = mount(TextInputBase, { props: { modelValue: 'hello' } })
    const input = wrapper.get('input')
    expect(input.element.value).toBe('hello')
    input.element.value = 'typed'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['typed'])
  })

  it('marks itself invalid via aria-invalid on the input', () => {
    const wrapper = mount(TextInputBase, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('.text-input-base').attributes('data-invalid')).toBe('true')
  })

  it('disables the input', () => {
    const wrapper = mount(TextInputBase, { props: { disabled: true } })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })

  it('passes through id and aria-describedby attrs onto the input', () => {
    const wrapper = mount(TextInputBase, {
      attrs: { 'id': 'x', 'aria-describedby': 'x-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('x')
    expect(input.attributes('aria-describedby')).toBe('x-hint')
  })

  it('omits the prefix and suffix spans when their slots are absent', () => {
    const wrapper = mount(TextInputBase)
    expect(wrapper.find('.text-input-base-prefix').exists()).toBe(false)
    expect(wrapper.find('.text-input-base-suffix').exists()).toBe(false)
  })

  it('renders prefix before, and suffix after, the input', () => {
    const wrapper = mount(TextInputBase, {
      slots: {
        prefix: '<span class="lead">icon</span>',
        suffix: '<span class="trail">clear</span>',
      },
    })
    const prefix = wrapper.get('.text-input-base-prefix').element
    const suffix = wrapper.get('.text-input-base-suffix').element
    expect(prefix.nextElementSibling?.className).toContain('text-input-base-field')
    expect(suffix.previousElementSibling?.className).toContain('text-input-base-field')
    expect(wrapper.get('.text-input-base-prefix .lead').text()).toBe('icon')
    expect(wrapper.get('.text-input-base-suffix .trail').text()).toBe('clear')
  })

  it('marks the field mono only when asked', () => {
    expect(mount(TextInputBase).get('input').attributes('data-mono')).toBeUndefined()
    expect(
      mount(TextInputBase, { props: { mono: true } }).get('input').attributes('data-mono'),
    ).toBeDefined()
  })
})
