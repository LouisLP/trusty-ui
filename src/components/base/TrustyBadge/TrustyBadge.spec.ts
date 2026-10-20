import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyBadge from './TrustyBadge.vue'

describe('trustyBadge', () => {
  it('renders the label', () => {
    const wrapper = mount(TrustyBadge, { props: { label: 'Online' } })
    expect(wrapper.get('.trusty-badge').text()).toContain('Online')
  })

  it('defaults to the neutral variant', () => {
    const wrapper = mount(TrustyBadge, { props: { label: 'Idle' } })
    expect(wrapper.get('.trusty-badge').attributes('data-variant')).toBe('neutral')
  })

  it('reflects the variant on the root element', () => {
    const wrapper = mount(TrustyBadge, { props: { label: 'Disconnected', variant: 'error' } })
    expect(wrapper.get('.trusty-badge').attributes('data-variant')).toBe('error')
  })

  it('omits the icon by default', () => {
    const wrapper = mount(TrustyBadge, { props: { label: 'Idle' } })
    expect(wrapper.find('.trusty-badge-icon').exists()).toBe(false)
  })

  it('renders a leading icon when given', () => {
    const wrapper = mount(TrustyBadge, { props: { label: 'Online', icon: 'ph:check-circle' } })
    expect(wrapper.find('.trusty-badge-icon').exists()).toBe(true)
  })

  it('renders no icon for an empty icon string', () => {
    const wrapper = mount(TrustyBadge, { props: { label: 'Idle', icon: '' as never } })
    expect(wrapper.find('.trusty-badge-icon').exists()).toBe(false)
  })
})
