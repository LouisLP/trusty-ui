import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustySpinner from './TrustySpinner.vue'

describe('trustySpinner', () => {
  it('announces itself as a busy status at size md by default', () => {
    const wrapper = mount(TrustySpinner)
    const root = wrapper.get('[role="status"]')

    expect(root.attributes('data-size')).toBe('md')
    // The name is fixed: every spinner announces the same wait.
    expect(root.text()).toBe('Loading…')
    expect(root.get('.trusty-spinner-sr').attributes('aria-hidden')).toBeUndefined()
    // The icon stays hidden from assistive tech, so that label is the only announced text.
    expect(wrapper.get('.trusty-icon').attributes('aria-hidden')).toBe('true')
  })

  it('spins the loading-spinner icon at the requested size', () => {
    const wrapper = mount(TrustySpinner, { props: { size: 'lg' } })
    const icon = wrapper.findComponent(TrustyIcon)

    expect(icon.props('name')).toBe('ph:spinner-gap')
    expect(icon.props('size')).toBe('lg')
    expect(wrapper.get('[role="status"]').attributes('data-size')).toBe('lg')
  })
})
