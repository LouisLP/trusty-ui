import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyForm from './TrustyForm.vue'

describe('trustyForm', () => {
  it('renders a novalidate form with slotted fields', () => {
    const wrapper = mount(TrustyForm, { slots: { default: '<span data-test="field" />' } })
    expect(wrapper.get('form').attributes('novalidate')).toBeDefined()
    expect(wrapper.find('[data-test="field"]').exists()).toBe(true)
  })

  it('hides the summary when there are no errors', () => {
    const wrapper = mount(TrustyForm)
    expect(wrapper.find('.trusty-form-summary').exists()).toBe(false)
  })

  it('renders the error summary as an alert', () => {
    const wrapper = mount(TrustyForm, {
      props: { errors: ['First problem', { message: 'Second problem' }] },
    })
    const summary = wrapper.get('.trusty-form-summary')
    expect(summary.attributes('role')).toBe('alert')
    expect(wrapper.findAll('.trusty-form-summary-list li')).toHaveLength(2)
    expect(summary.text()).toContain('First problem')
  })

  it('links summary entries that carry a targetId', () => {
    const wrapper = mount(TrustyForm, {
      props: { errors: [{ message: 'Fix email', targetId: 'email-field' }] },
    })
    expect(wrapper.get('.trusty-form-summary-link').attributes('href')).toBe('#email-field')
  })

  it('emits submit and prevents the native submit', async () => {
    const wrapper = mount(TrustyForm)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('renders the actions slot', () => {
    const wrapper = mount(TrustyForm, { slots: { actions: '<button data-test="save" />' } })
    expect(wrapper.find('[data-test="save"]').exists()).toBe(true)
  })
})
