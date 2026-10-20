import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyToggle from './TrustyToggle.vue'

describe('trustyToggle', () => {
  it('renders a toggle button with its label, off by default', () => {
    const wrapper = mount(TrustyToggle, { props: { label: 'Bold' } })
    const btn = wrapper.get('button')

    expect(btn.text()).toBe('Bold')
    expect(btn.attributes('data-state')).toBe('off')
    expect(btn.attributes('aria-pressed')).toBe('false')
  })

  it('reflects the initial v-model value as pressed', () => {
    const wrapper = mount(TrustyToggle, { props: { label: 'Bold', modelValue: true } })

    expect(wrapper.get('button').attributes('data-state')).toBe('on')
  })

  it('toggles and emits update:modelValue on click', async () => {
    const wrapper = mount(TrustyToggle, { props: { label: 'Bold', modelValue: false } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })

  it('renders an icon and squares off when icon-only', () => {
    const wrapper = mount(TrustyToggle, { props: { icon: 'ph:gear' }, attrs: { 'aria-label': 'Settings' } })

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:gear')
    expect(wrapper.get('button').attributes('data-icon-only')).toBe('true')
  })

  it('does not toggle while disabled', async () => {
    const wrapper = mount(TrustyToggle, { props: { label: 'Bold', disabled: true } })
    const btn = wrapper.get('button')

    expect(btn.attributes('disabled')).toBeDefined()
    await btn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
