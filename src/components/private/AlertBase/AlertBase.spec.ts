import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AlertBase from './AlertBase.vue'

describe('alertBase', () => {
  it('renders the title', () => {
    const wrapper = mount(AlertBase, { props: { title: 'Heads up' } })
    expect(wrapper.get('.alert-base-title').text()).toBe('Heads up')
  })

  it('defaults to the info variant', () => {
    const wrapper = mount(AlertBase, { props: { title: 'Heads up' } })
    expect(wrapper.get('.alert-base').attributes('data-variant')).toBe('info')
  })

  it('reflects the variant on the root element', () => {
    const wrapper = mount(AlertBase, { props: { title: 'Boom', variant: 'error' } })
    expect(wrapper.get('.alert-base').attributes('data-variant')).toBe('error')
  })

  it('omits the description when not given', () => {
    const wrapper = mount(AlertBase, { props: { title: 'Heads up' } })
    expect(wrapper.find('.alert-base-description').exists()).toBe(false)
  })

  it('renders the description when given', () => {
    const wrapper = mount(AlertBase, {
      props: { title: 'Heads up', description: 'Something changed.' },
    })
    expect(wrapper.get('.alert-base-description').text()).toBe('Something changed.')
  })

  it('always shows the status icon', () => {
    const wrapper = mount(AlertBase, { props: { title: 'Heads up' } })
    expect(wrapper.find('.alert-base-icon').exists()).toBe(true)
  })

  it.each([
    ['error', 'alert'],
    ['warning', 'alert'],
    ['info', 'status'],
    ['success', 'status'],
  ] as const)('gives the %s variant role %s', (variant, role) => {
    const wrapper = mount(AlertBase, { props: { title: 'Heads up', variant } })
    expect(wrapper.get('.alert-base').attributes('role')).toBe(role)
  })

  it('renders default slot content after the description', () => {
    const wrapper = mount(AlertBase, {
      props: { title: 'Heads up' },
      slots: { default: '<button>Act</button>' },
    })
    expect(wrapper.get('.alert-base-content button').text()).toBe('Act')
  })
})
