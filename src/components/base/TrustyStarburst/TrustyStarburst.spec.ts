import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyStarburst from './TrustyStarburst.vue'

describe('trustyStarburst', () => {
  it('renders the stamp variant, hidden from assistive tech, by default', () => {
    const wrapper = mount(TrustyStarburst)
    const root = wrapper.get('svg')

    expect(root.attributes('data-variant')).toBe('stamp')
    expect(root.attributes('viewBox')).toBe('0 0 120 40')
    // Pure ornament: nothing to announce.
    expect(root.attributes('aria-hidden')).toBe('true')
  })

  it('draws three frames of the same rays for the boil to cycle', () => {
    const wrapper = mount(TrustyStarburst, { props: { variant: 'spark' } })
    const frames = wrapper.findAll('.trusty-starburst-frame')

    expect(frames).toHaveLength(3)
    // Every redraw holds the same ray count, so the colour alternation stays put.
    for (const frame of frames)
      expect(frame.findAll('line')).toHaveLength(4)
  })

  it('swaps the geometry with the variant', () => {
    const wrapper = mount(TrustyStarburst, { props: { variant: 'burst' } })

    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 100 240')
    expect(wrapper.get('.trusty-starburst-frame').findAll('line')).toHaveLength(6)
  })
})
