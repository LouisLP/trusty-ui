import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyCheckbox from './TrustyCheckbox.vue'

describe('trustyCheckbox', () => {
  it('renders a checkbox with its label, unchecked by default', () => {
    const wrapper = mount(TrustyCheckbox, { props: { label: 'Accept' } })
    const box = wrapper.get('[role="checkbox"]')

    expect(wrapper.text()).toContain('Accept')
    expect(box.attributes('data-state')).toBe('unchecked')
    expect(box.attributes('aria-checked')).toBe('false')
  })

  it('reflects the initial v-model value', () => {
    const wrapper = mount(TrustyCheckbox, { props: { modelValue: true } })

    expect(wrapper.get('[role="checkbox"]').attributes('data-state')).toBe('checked')
  })

  it('toggles and emits update:modelValue on click', async () => {
    const wrapper = mount(TrustyCheckbox, { props: { modelValue: false } })

    await wrapper.get('[role="checkbox"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('renders the indeterminate state', () => {
    const wrapper = mount(TrustyCheckbox, { props: { modelValue: 'indeterminate' } })

    expect(wrapper.get('[role="checkbox"]').attributes('data-state')).toBe('indeterminate')
  })

  it('defaults to the md size and reflects an explicit size', () => {
    expect(mount(TrustyCheckbox).get('.trusty-checkbox').attributes('data-size')).toBe('md')
    expect(
      mount(TrustyCheckbox, { props: { size: 'sm' } }).get('.trusty-checkbox').attributes('data-size'),
    ).toBe('sm')
  })

  it('does not toggle while disabled', async () => {
    const wrapper = mount(TrustyCheckbox, { props: { modelValue: false, disabled: true } })
    const box = wrapper.get('[role="checkbox"]')

    expect(box.attributes('disabled')).toBeDefined()
    await box.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
