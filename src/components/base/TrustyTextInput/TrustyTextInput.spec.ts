import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyTextInput from './TrustyTextInput.vue'

describe('trustyTextInput', () => {
  it('renders a text input by default', () => {
    const wrapper = mount(TrustyTextInput)
    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('text')
  })

  it('honours the type prop', () => {
    const wrapper = mount(TrustyTextInput, { props: { type: 'email' } })
    expect(wrapper.get('input').attributes('type')).toBe('email')
  })

  it('reflects the initial v-model value', () => {
    const wrapper = mount(TrustyTextInput, { props: { modelValue: 'hello' } })
    expect(wrapper.get('input').element.value).toBe('hello')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TrustyTextInput)
    const input = wrapper.get('input')
    input.element.value = 'typed'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['typed'])
  })

  it('marks itself invalid via aria-invalid', () => {
    const wrapper = mount(TrustyTextInput, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('passes through id and aria-describedby attrs onto the input', () => {
    const wrapper = mount(TrustyTextInput, {
      attrs: { 'id': 'x', 'aria-describedby': 'x-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('x')
    expect(input.attributes('aria-describedby')).toBe('x-hint')
  })

  it('disables the input', () => {
    const wrapper = mount(TrustyTextInput, { props: { disabled: true } })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })
})
