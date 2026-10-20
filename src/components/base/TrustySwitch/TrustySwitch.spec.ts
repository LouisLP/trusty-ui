import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustySwitch from './TrustySwitch.vue'

describe('trustySwitch', () => {
  it('renders a switch with its label, off by default', () => {
    const wrapper = mount(TrustySwitch, { props: { label: 'Wi-Fi' } })
    const root = wrapper.get('[role="switch"]')

    expect(wrapper.text()).toContain('Wi-Fi')
    expect(root.attributes('data-state')).toBe('unchecked')
    expect(root.attributes('aria-checked')).toBe('false')
  })

  it('reflects the initial v-model value', () => {
    const wrapper = mount(TrustySwitch, { props: { modelValue: true } })

    expect(wrapper.get('[role="switch"]').attributes('data-state')).toBe('checked')
  })

  it('toggles and emits update:modelValue on click', async () => {
    const wrapper = mount(TrustySwitch, { props: { modelValue: false } })

    await wrapper.get('[role="switch"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('does not toggle while disabled', async () => {
    const wrapper = mount(TrustySwitch, { props: { modelValue: false, disabled: true } })
    const root = wrapper.get('[role="switch"]')

    expect(root.attributes('disabled')).toBeDefined()
    await root.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
