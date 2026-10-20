import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustySlider from './TrustySlider.vue'

describe('trustySlider', () => {
  it('renders a single thumb and fills the range to the value', () => {
    // jsdom has no layout, so Reka keeps the thumb hidden and never sets aria-valuenow; the range fill (right: 60% for 40/100) is the reliable signal that the value propagated.
    const wrapper = mount(TrustySlider, { props: { modelValue: [40], min: 0, max: 100 } })

    expect(wrapper.findAll('[role="slider"]')).toHaveLength(1)
    expect(wrapper.get('.trusty-slider-range').attributes('style')).toContain('right: 60%')
  })

  it('exposes min/max on the thumb', () => {
    const wrapper = mount(TrustySlider, { props: { modelValue: [5], min: 0, max: 10 } })
    const thumb = wrapper.get('[role="slider"]')

    expect(thumb.attributes('aria-valuemin')).toBe('0')
    expect(thumb.attributes('aria-valuemax')).toBe('10')
  })

  it('renders one thumb per value for a range slider', () => {
    const wrapper = mount(TrustySlider, { props: { modelValue: [20, 80] } })

    expect(wrapper.findAll('[role="slider"]')).toHaveLength(2)
  })

  it('moves the value with the arrow keys and emits update:modelValue', async () => {
    const wrapper = mount(TrustySlider, { props: { modelValue: [40], step: 5 } })

    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[45]])
  })

  it('marks the root disabled', () => {
    const wrapper = mount(TrustySlider, { props: { modelValue: [50], disabled: true } })

    expect(wrapper.get('.trusty-slider').attributes('aria-disabled')).toBe('true')
  })
  it('names the thumb from a fall-through aria-label, keeping class on the wrapper', () => {
    const wrapper = mount(TrustySlider, { props: { modelValue: [50] }, attrs: { 'aria-label': 'Speed', 'class': 'extra' } })

    expect(wrapper.get('[role="slider"]').attributes('aria-label')).toBe('Speed')
    expect(wrapper.get('.trusty-slider-wrapper').classes()).toContain('extra')
  })

  it('labels a range slider as a group, not each thumb', () => {
    const wrapper = mount(TrustySlider, { props: { modelValue: [20, 80] }, attrs: { 'aria-label': 'Price' } })

    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Price')
    expect(wrapper.findAll('[role="slider"]').map(t => t.attributes('aria-label'))).not.toContain('Price')
  })
})
