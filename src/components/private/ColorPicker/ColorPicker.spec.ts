import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ColorPicker from './ColorPicker.vue'

// TrustyColorInput covers the pick-to-hex path; these pin the panel's parts.
describe('colorPicker', () => {
  it('opens an area and a hue slider from the swatch', async () => {
    const wrapper = mount(ColorPicker, { props: { color: '#752BD4' }, attachTo: document.body })
    await wrapper.get('button[aria-label="Pick colour"]').trigger('click')
    expect(document.body.querySelector('[role="application"]')).not.toBeNull()
    expect(document.body.querySelector('.color-channel-slider[data-channel="hue"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('emits a pick from the area', async () => {
    const wrapper = mount(ColorPicker, { props: { color: '#752BD4' }, attachTo: document.body })
    await wrapper.get('button').trigger('click')
    document.body.querySelector('[role="application"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(wrapper.emitted<[string]>('pick')?.at(-1)?.[0]).toMatch(/^#[\da-f]{6}$/i)
    wrapper.unmount()
  })

  it('marks the swatch empty with no colour', () => {
    const wrapper = mount(ColorPicker, { props: { color: null } })
    expect(wrapper.get('.color-picker-swatch').attributes('data-no-color')).toBeDefined()
  })

  it('disables the trigger', () => {
    const wrapper = mount(ColorPicker, { props: { color: null, disabled: true } })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
