import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyCollapsible from './TrustyCollapsible.vue'

describe('trustyCollapsible', () => {
  it('renders the description in a button and starts closed', () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details' },
      slots: { default: 'Panel body' },
    })
    const trigger = wrapper.get('button')

    expect(trigger.text()).toBe('Details')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.text()).not.toContain('Panel body')
  })

  it('starts open when open is bound true', () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details', open: true },
      slots: { default: 'Panel body' },
    })

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Panel body')
  })

  it('emits update:open when the trigger is clicked', async () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details' },
      slots: { default: 'Panel body' },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('reveals its body on its own when open is left unbound', async () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details' },
      slots: { default: 'Panel body' },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Panel body')
  })

  it('follows a bound open prop rather than its own state', async () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details', open: true },
      slots: { default: 'Panel body' },
    })

    expect(wrapper.text()).toContain('Panel body')

    await wrapper.setProps({ open: false })
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
  })

  it('disables the trigger and emits nothing when disabled', async () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details', disabled: true },
      slots: { default: 'Panel body' },
    })
    const trigger = wrapper.get('button')

    expect(trigger.attributes('disabled')).toBeDefined()

    await trigger.trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('carries one leading marker and no other icon', () => {
    const wrapper = mount(TrustyCollapsible, { props: { description: 'Details' } })

    expect(wrapper.findAllComponents(TrustyIcon).map(i => i.props('name'))).toEqual(['ph:caret-right'])
  })

  it('reflects the open state on the trigger so the marker can turn', () => {
    const wrapper = mount(TrustyCollapsible, { props: { description: 'Details', open: true } })

    expect(wrapper.get('button').attributes('data-state')).toBe('open')
  })

  it('hides the content from assistive tech while closed', () => {
    const wrapper = mount(TrustyCollapsible, {
      props: { description: 'Details' },
      slots: { default: 'Panel body' },
    })
    const content = wrapper.get('.trusty-collapsible-content')

    expect(content.attributes('hidden')).toBeDefined()
    expect(content.attributes('data-state')).toBe('closed')
  })
})
