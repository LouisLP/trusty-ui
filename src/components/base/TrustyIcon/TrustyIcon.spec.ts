import { Icon } from '@iconify/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { bundledIcons } from '../../../icons'
import TrustyIcon from './TrustyIcon.vue'

describe('trustyIcon', () => {
  it('renders a bundled icon synchronously, from its inlined data', () => {
    const wrapper = mount(TrustyIcon, { props: { name: 'ph:x' } })

    expect(wrapper.findComponent(Icon).props('icon')).toBe(bundledIcons['ph:x'])
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('passes any other Iconify name through to <Icon>, which fetches it', () => {
    const wrapper = mount(TrustyIcon, { props: { name: 'mdi:home' } })

    expect(wrapper.findComponent(Icon).props('icon')).toBe('mdi:home')
  })

  it('reflects a named size as a data attribute (styled in CSS)', () => {
    const wrapper = mount(TrustyIcon, { props: { name: 'ph:x', size: 'lg' } })

    expect(wrapper.get('.trusty-icon').attributes('data-size')).toBe('lg')
  })

  it('omits data-size by default (falls back to 1em)', () => {
    const wrapper = mount(TrustyIcon, { props: { name: 'ph:x' } })

    expect(wrapper.get('.trusty-icon').attributes('data-size')).toBeUndefined()
  })
})
