import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NumberFieldBase from './NumberFieldBase.vue'

// Private primitive; TrustyNumberField covers its numeric behaviour end-to-end. These tests pin only what the wrapper relies on.
describe('numberFieldBase', () => {
  it('inputDisabled blocks typing (readonly) but keeps the steppers usable', () => {
    const wrapper = mount(NumberFieldBase, {
      props: { steppers: true, inputDisabled: true, modelValue: 5 },
    })
    const input = wrapper.get('input')
    // readonly, not disabled: the input stays focusable for arrow-key stepping.
    expect(input.attributes('readonly')).toBeDefined()
    expect(input.attributes('disabled')).toBeUndefined()
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    for (const button of buttons)
      expect(button.attributes('disabled')).toBeUndefined()
  })

  it('inputDisabled still steps the value via arrow keys on the focused input', async () => {
    const wrapper = mount(NumberFieldBase, {
      props: { steppers: true, inputDisabled: true, modelValue: 5 },
    })
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([6])
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5])
  })

  it('steps by 10^-precision when precision is set without an explicit step', async () => {
    const wrapper = mount(NumberFieldBase, {
      props: { steppers: true, precision: 3, modelValue: 0.607 },
    })
    // Steps via the keyboard path (jsdom can't drive Reka's pointer-hold steppers); both routes share the same step resolution. A fixed step of 1 would make Reka's step snapping jump to 2 here.
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0.608])
  })

  it('an explicit step wins over the precision-derived one', async () => {
    const wrapper = mount(NumberFieldBase, {
      props: { steppers: true, precision: 3, step: 0.1, modelValue: 0.6 },
    })
    await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0.7])
  })

  it('disabled switches off the input and both steppers', () => {
    const wrapper = mount(NumberFieldBase, {
      props: { steppers: true, disabled: true, modelValue: 5 },
    })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    for (const button of wrapper.findAll('button'))
      expect(button.attributes('disabled')).toBeDefined()
  })
})
