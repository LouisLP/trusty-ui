import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustySeparator from './TrustySeparator.vue'

describe('trustySeparator', () => {
  it('renders a horizontal separator at size sm by default', () => {
    const wrapper = mount(TrustySeparator)
    const root = wrapper.get('[role="separator"]')

    expect(root.attributes('data-orientation')).toBe('horizontal')
    expect(root.attributes('data-size')).toBe('sm')
    // Horizontal is the implicit orientation, so ARIA leaves it off.
    expect(root.attributes('aria-orientation')).toBeUndefined()
  })

  it('announces the vertical orientation to assistive technology', () => {
    const wrapper = mount(TrustySeparator, { props: { orientation: 'vertical' } })
    const root = wrapper.get('[role="separator"]')

    expect(root.attributes('data-orientation')).toBe('vertical')
    expect(root.attributes('aria-orientation')).toBe('vertical')
  })

  it('reflects the size so the thickness token can swap', () => {
    const wrapper = mount(TrustySeparator, { props: { size: 'md' } })

    expect(wrapper.get('[role="separator"]').attributes('data-size')).toBe('md')
  })
})
