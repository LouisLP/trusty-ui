import type { TrustyFormField } from './TrustyFormItem.types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import TrustyFormItem from './TrustyFormItem.vue'

// Render the slot as a real input bound to `field`, so we can assert the wiring.
function mountWithInput(props: Record<string, unknown>) {
  return mount(TrustyFormItem, {
    props,
    slots: {
      default: ({ field }: { field: TrustyFormField }) =>
        h('input', { ...field, 'data-test': 'control' }),
    },
  })
}

describe('trustyFormItem', () => {
  it('ties the label to the control via for/id', () => {
    const wrapper = mountWithInput({ label: 'Email' })
    const label = wrapper.get('label')
    const input = wrapper.get('[data-test="control"]')
    expect(label.text()).toContain('Email')
    expect(label.attributes('for')).toBe(input.attributes('id'))
  })

  it('honours a supplied controlId', () => {
    const wrapper = mountWithInput({ label: 'Email', controlId: 'email-field' })
    expect(wrapper.get('label').attributes('for')).toBe('email-field')
    expect(wrapper.get('[data-test="control"]').attributes('id')).toBe('email-field')
  })

  it('links hint and error through aria-describedby', () => {
    const wrapper = mountWithInput({ label: 'Email', hint: 'A hint', error: 'An error' })
    const describedBy = wrapper.get('[data-test="control"]').attributes('aria-describedby')
    const hintId = wrapper.get('.trusty-form-item-hint').attributes('id')
    const errorId = wrapper.get('.trusty-form-item-error').attributes('id')
    expect(describedBy).toContain(hintId)
    expect(describedBy).toContain(errorId)
  })

  it('announces the error and flags invalid in the field contract', () => {
    // `field.invalid` is a boolean the control maps to aria-invalid (see control specs); h() spreads it as a raw attr here, so we assert it propagated.
    const wrapper = mountWithInput({ label: 'Email', error: 'Bad' })
    expect(wrapper.get('[data-test="control"]').attributes('invalid')).toBe('true')
    const error = wrapper.get('.trusty-form-item-error')
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toBe('Bad')
  })

  it('shows a required marker and sets the control required', () => {
    const wrapper = mountWithInput({ label: 'Email', required: true })
    expect(wrapper.find('.trusty-form-item-required').exists()).toBe(true)
    expect(wrapper.get('[data-test="control"]').attributes('required')).toBeDefined()
  })

  it('renders the info tooltip trigger only when labelTooltip is set', () => {
    const without = mountWithInput({ label: 'Email' })
    expect(without.find('.trusty-form-item-info').exists()).toBe(false)

    const withTip = mountWithInput({ label: 'Email', labelTooltip: 'Where to find it' })
    const trigger = withTip.get('.trusty-form-item-info')
    // Keyboard-focusable button, kept outside the <label> so it never proxies clicks to the control.
    expect(trigger.element.tagName).toBe('BUTTON')
    expect(withTip.get('label').element.contains(trigger.element)).toBe(false)
  })

  it('ignores labelTooltip when there is no label', () => {
    const wrapper = mountWithInput({ labelTooltip: 'Orphan tooltip' })
    expect(wrapper.find('.trusty-form-item-info').exists()).toBe(false)
  })

  it('uses aria-labelledby (not for/id) in group mode', () => {
    const wrapper = mountWithInput({ label: 'Speed', group: true })
    const label = wrapper.get('.trusty-form-item-label')
    expect(label.element.tagName).toBe('SPAN')
    expect(label.attributes('for')).toBeUndefined()
    expect(wrapper.get('[data-test="control"]').attributes('aria-labelledby')).toBe(label.attributes('id'))
  })
})
