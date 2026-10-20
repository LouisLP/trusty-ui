import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyNumberField from './TrustyNumberField.vue'

describe('trustyNumberField', () => {
  it('renders a bare input with no steppers by default', () => {
    const wrapper = mount(TrustyNumberField)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('shows +/- steppers when steppers is opted in', () => {
    const wrapper = mount(TrustyNumberField, { props: { steppers: true } })
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('displays the bound model value in the input', () => {
    const wrapper = mount(TrustyNumberField, { props: { modelValue: 7 } })
    expect(wrapper.get('input').element.value).toBe('7')
  })

  it('keeps decimal precision by default (no silent rounding)', () => {
    const wrapper = mount(TrustyNumberField, { props: { modelValue: 1.23456 } })
    expect(wrapper.get('input').element.value).toBe('1.23456')
  })

  it('caps fraction digits at the given precision', () => {
    const wrapper = mount(TrustyNumberField, { props: { modelValue: 1.23456, precision: 2 } })
    expect(wrapper.get('input').element.value).toBe('1.23')
  })

  it('renders a decorative unit suffix', () => {
    const wrapper = mount(TrustyNumberField, { props: { unit: 'mm' } })
    const unit = wrapper.get('.trusty-number-field-unit')
    expect(unit.text()).toBe('mm')
    expect(unit.attributes('aria-hidden')).toBe('true')
  })

  it('formats the value with formatOptions', () => {
    const wrapper = mount(TrustyNumberField, {
      props: { modelValue: 1234, formatOptions: { style: 'decimal' } },
    })
    // Locale grouping applied by the primitive (e.g. "1,234").
    expect(wrapper.get('input').element.value).toMatch(/1.?234/)
  })

  it('has no leading prefix — it is the plain, slot-less field', () => {
    const wrapper = mount(TrustyNumberField)
    expect(wrapper.find('.trusty-number-field-prefix').exists()).toBe(false)
  })

  it('marks the input invalid via aria-invalid', () => {
    const wrapper = mount(TrustyNumberField, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('passes through fall-through attrs onto the input', () => {
    const wrapper = mount(TrustyNumberField, {
      attrs: { 'id': 'qty', 'aria-describedby': 'qty-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('qty')
    expect(input.attributes('aria-describedby')).toBe('qty-hint')
  })
})
