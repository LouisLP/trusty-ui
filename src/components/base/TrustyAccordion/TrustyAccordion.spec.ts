import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyAccordion from './TrustyAccordion.vue'

const ITEMS = [
  { value: 'status', label: 'Status' },
  { value: 'layout', label: 'Layout' },
  { value: 'components', label: 'Components' },
]

const SLOTS = {
  status: 'Status panel',
  layout: 'Layout panel',
  components: 'Components panel',
}

describe('trustyAccordion', () => {
  it('renders one header button per item', () => {
    const wrapper = mount(TrustyAccordion, { props: { items: ITEMS }, slots: SLOTS })
    const triggers = wrapper.findAll('button')

    expect(triggers).toHaveLength(3)
    expect(triggers.map(t => t.text())).toEqual(['Status', 'Layout', 'Components'])
  })

  it('wraps every trigger in a heading, so the panels are navigable landmarks', () => {
    const wrapper = mount(TrustyAccordion, { props: { items: ITEMS }, slots: SLOTS })

    expect(wrapper.findAll('h3')).toHaveLength(3)
    expect(wrapper.get('h3').find('button').exists()).toBe(true)
  })

  it('starts with every panel closed', () => {
    const wrapper = mount(TrustyAccordion, { props: { items: ITEMS }, slots: SLOTS })

    expect(wrapper.findAll('button').every(t => t.attributes('aria-expanded') === 'false')).toBe(true)
    expect(wrapper.text()).not.toContain('Status panel')
  })

  it('honours the initial v-model value and shows that panel only', () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: ITEMS, modelValue: 'layout' },
      slots: SLOTS,
    })

    expect(wrapper.findAll('button')[1]!.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Layout panel')
    expect(wrapper.text()).not.toContain('Status panel')
  })

  it('emits the opened panel value when a header is clicked', async () => {
    const wrapper = mount(TrustyAccordion, { props: { items: ITEMS }, slots: SLOTS })

    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['status'])
  })

  it('closes the open panel when its own header is clicked again', async () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: ITEMS, modelValue: 'status' },
      slots: SLOTS,
    })

    await wrapper.findAll('button')[0]!.trigger('click')

    // `collapsible` lets a single-type accordion clear its own selection.
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined])
  })

  it('reports an array of open panels when type is multiple', async () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: ITEMS, type: 'multiple' as const, modelValue: ['status'] },
      slots: SLOTS,
    })

    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['status', 'layout']])
  })

  it('disables a single panel without disabling its siblings', async () => {
    const items = [
      { value: 'status', label: 'Status' },
      { value: 'layout', label: 'Layout', disabled: true },
    ]
    const wrapper = mount(TrustyAccordion, { props: { items }, slots: SLOTS })
    const disabled = wrapper.findAll('button')[1]!

    expect(disabled.attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('button')[0]!.attributes('disabled')).toBeUndefined()

    await disabled.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('disables every panel when the group is disabled', () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: ITEMS, disabled: true },
      slots: SLOTS,
    })

    expect(wrapper.findAll('button').every(t => t.attributes('disabled') !== undefined)).toBe(true)
  })

  it('renders the item description above the slot body', () => {
    const items = [{ value: 'status', label: 'Status', description: 'What the render is doing.' }]
    const wrapper = mount(TrustyAccordion, {
      props: { items, modelValue: 'status' },
      slots: { status: 'Status panel' },
    })

    expect(wrapper.get('.trusty-accordion-description').text()).toBe('What the render is doing.')
    expect(wrapper.text()).toContain('Status panel')
  })

  it('renders the leading icon when the item names one', () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: [{ value: 'status', label: 'Status', icon: 'ph:info' as const }] },
      slots: { status: 'x' },
    })

    // Two icons per header: the leading glyph, then the open/closed marker.
    expect(wrapper.findAllComponents(TrustyIcon).map(i => i.props('name'))).toEqual(['ph:info', 'ph:caret-down'])
  })

  it('reflects the open state on the trigger so the marker can flip', async () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: ITEMS, modelValue: 'status' },
      slots: SLOTS,
    })

    expect(wrapper.findAll('button')[0]!.attributes('data-state')).toBe('open')
    expect(wrapper.findAll('button')[1]!.attributes('data-state')).toBe('closed')
  })

  it('labels the open panel region with its own header', () => {
    const wrapper = mount(TrustyAccordion, {
      props: { items: ITEMS, modelValue: 'status' },
      slots: SLOTS,
    })
    const trigger = wrapper.findAll('button')[0]!
    const region = wrapper.get('[role="region"]')

    expect(region.attributes('aria-labelledby')).toBe(trigger.attributes('id'))
  })
})
