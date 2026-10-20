import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyAlert from './TrustyAlert.vue'

describe('trustyAlert', () => {
  it('renders title and description', () => {
    const wrapper = mount(TrustyAlert, {
      props: { title: 'Confirm export', description: 'The timeline will render at full resolution.' },
    })
    expect(wrapper.get('.alert-base-title').text()).toBe('Confirm export')
    expect(wrapper.get('.alert-base-description').text()).toBe('The timeline will render at full resolution.')
  })

  it('defaults to the info variant', () => {
    const wrapper = mount(TrustyAlert, { props: { title: 'Confirm move' } })
    expect(wrapper.get('.trusty-alert').attributes('data-variant')).toBe('info')
  })

  it('reflects the variant on the root element', () => {
    const wrapper = mount(TrustyAlert, { props: { title: 'Confirm move', variant: 'warning' } })
    expect(wrapper.get('.trusty-alert').attributes('data-variant')).toBe('warning')
  })

  it('renders slotted actions in the actions row', () => {
    const wrapper = mount(TrustyAlert, {
      props: { title: 'Confirm move' },
      slots: { default: '<button>Approve</button><button>Deny</button>' },
    })
    const actions = wrapper.get('.trusty-alert-actions')
    expect(actions.findAll('button')).toHaveLength(2)
    expect(actions.text()).toContain('Approve')
  })
})
