import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustySecretInput from './TrustySecretInput.vue'

describe('trustySecretInput', () => {
  it('masks the value by default', () => {
    const wrapper = mount(TrustySecretInput)
    expect(wrapper.get('input').attributes('type')).toBe('password')
  })

  it('reveals and re-hides the value via the toggle', async () => {
    const wrapper = mount(TrustySecretInput)
    const toggle = wrapper.get('button')
    expect(toggle.attributes('aria-pressed')).toBe('false')

    await toggle.trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(toggle.attributes('aria-pressed')).toBe('true')

    await toggle.trigger('click')
    expect(wrapper.get('input').attributes('type')).toBe('password')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TrustySecretInput)
    const input = wrapper.get('input')
    input.element.value = 'sk-123'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['sk-123'])
  })

  it('lands fall-through attrs (id, aria-*) on the input, not the wrapper', () => {
    const wrapper = mount(TrustySecretInput, {
      attrs: { 'id': 'secret', 'aria-describedby': 'secret-err' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('secret')
    expect(input.attributes('aria-describedby')).toBe('secret-err')
    expect(wrapper.element.id).toBe('')
  })

  it('composes TextInputBase rather than reproducing its shell', () => {
    // The shell (border, hover/focus-within ring, invalid + disabled states) belongs to the base, so it is asserted there and not copied here.
    const wrapper = mount(TrustySecretInput)
    expect(wrapper.find('.text-input-base').exists()).toBe(true)
    expect(wrapper.get('input').classes()).toContain('text-input-base-field')
    expect(wrapper.get('button').element.closest('.text-input-base-suffix')).not.toBeNull()
  })

  it('renders the value in the mono family', () => {
    const wrapper = mount(TrustySecretInput)
    expect(wrapper.get('input').attributes('data-mono')).toBeDefined()
  })

  it('disables both the input and the toggle', () => {
    const wrapper = mount(TrustySecretInput, { props: { disabled: true } })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
