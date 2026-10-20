import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustySearchInput from './TrustySearchInput.vue'

describe('trustySearchInput', () => {
  it('renders a native search input', () => {
    const wrapper = mount(TrustySearchInput)
    expect(wrapper.get('input').attributes('type')).toBe('search')
  })

  it('reflects the initial v-model value', () => {
    const wrapper = mount(TrustySearchInput, { props: { modelValue: 'Sunset' } })
    expect(wrapper.get('input').element.value).toBe('Sunset')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TrustySearchInput)
    const input = wrapper.get('input')
    input.element.value = 'typed'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['typed'])
  })

  it('hides the clear button when empty', () => {
    const wrapper = mount(TrustySearchInput)
    expect(wrapper.find('.trusty-search-input-clear').exists()).toBe(false)
  })

  it('shows the clear button once there is a value', () => {
    const wrapper = mount(TrustySearchInput, { props: { modelValue: 'Sunset' } })
    expect(wrapper.find('.trusty-search-input-clear').exists()).toBe(true)
  })

  it('clears the value when the clear button is clicked', async () => {
    const wrapper = mount(TrustySearchInput, { props: { modelValue: 'Sunset' } })
    await wrapper.get('.trusty-search-input-clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('never shows the clear button while disabled', () => {
    const wrapper = mount(TrustySearchInput, { props: { modelValue: 'Sunset', disabled: true } })
    expect(wrapper.find('.trusty-search-input-clear').exists()).toBe(false)
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })

  it('marks itself invalid via aria-invalid', () => {
    const wrapper = mount(TrustySearchInput, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('passes through id and aria-describedby attrs onto the input', () => {
    const wrapper = mount(TrustySearchInput, {
      attrs: { 'id': 's', 'aria-describedby': 's-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('s')
    expect(input.attributes('aria-describedby')).toBe('s-hint')
  })
})
