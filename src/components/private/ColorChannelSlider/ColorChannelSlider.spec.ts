import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorChannelSlider from './ColorChannelSlider.vue'

describe('colorChannelSlider', () => {
  it('emits the colour with the alpha byte written', async () => {
    const wrapper = mount(ColorChannelSlider, { props: { color: '#752BD4', channel: 'alpha' } })
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted<[string]>('pick')?.at(-1)?.[0].toUpperCase()).toBe('#752BD400')
  })

  it('emits a new hue', async () => {
    const wrapper = mount(ColorChannelSlider, { props: { color: '#752BD4', channel: 'hue' } })
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted<[string]>('pick')?.at(-1)?.[0].toUpperCase()).toBe('#D42B2B')
  })

  it('tints the alpha track with the opaque colour', () => {
    const wrapper = mount(ColorChannelSlider, { props: { color: '#752BD480', channel: 'alpha' } })
    expect(wrapper.attributes('style')).toContain('--color-channel-slider-opaque: #752BD4')
  })
})
