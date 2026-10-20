import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyToggleGroup from './TrustyToggleGroup.vue'

const ITEMS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
]

describe('trustyToggleGroup', () => {
  it('renders one button per item, none pressed by default', () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS } })
    const btns = wrapper.findAll('button')

    expect(btns).toHaveLength(3)
    expect(btns.map(b => b.text())).toEqual(['Left', 'Center', 'Right'])
    expect(btns.every(b => b.attributes('data-state') === 'off')).toBe(true)
  })

  it('reflects the initial single value as pressed', () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS, modelValue: 'center' } })
    const btns = wrapper.findAll('button')

    expect(btns[1]!.attributes('data-state')).toBe('on')
    expect(btns[0]!.attributes('data-state')).toBe('off')
  })

  it('emits the picked value as a string in single mode', async () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS, type: 'single', modelValue: undefined } })

    await wrapper.findAll('button')[2]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['right'])
  })

  it('keeps the pressed item on when it is clicked again in single mode', async () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS, modelValue: 'center' } })
    const btn = wrapper.findAll('button')[1]!

    await btn.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(btn.attributes('data-state')).toBe('on')
  })

  it('keeps the pressed item on without a bound v-model', async () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS } })
    const btn = wrapper.findAll('button')[0]!

    await btn.trigger('click')
    await btn.trigger('click')

    expect(btn.attributes('data-state')).toBe('on')
  })

  it('still un-presses an item clicked again in multiple mode', async () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS, type: 'multiple', modelValue: ['left'] } })

    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]])
  })

  it('emits an array in multiple mode', async () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS, type: 'multiple', modelValue: ['left'] } })

    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['left', 'center']])
  })

  it('uses the value as the accessible name for icon-only items', () => {
    const wrapper = mount(TrustyToggleGroup, {
      props: { items: [{ value: 'bold', icon: 'ph:gear' }] },
    })
    const btn = wrapper.get('button')

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:gear')
    expect(btn.attributes('aria-label')).toBe('bold')
    expect(btn.attributes('data-icon-only')).toBe('true')
  })

  it('disables every item when the group is disabled', () => {
    const wrapper = mount(TrustyToggleGroup, { props: { items: ITEMS, disabled: true } })

    expect(wrapper.findAll('button').every(b => b.attributes('disabled') !== undefined)).toBe(true)
  })
})
