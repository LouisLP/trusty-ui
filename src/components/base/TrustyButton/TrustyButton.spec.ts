import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyButton from './TrustyButton.vue'

describe('trustyButton', () => {
  it('renders a native button with type="button" and its label by default', () => {
    const wrapper = mount(TrustyButton, { props: { label: 'Save' } })
    const el = wrapper.get('button')

    expect(el.attributes('type')).toBe('button')
    expect(el.text()).toBe('Save')
    expect(el.attributes('data-variant')).toBe('primary')
    expect(el.attributes('data-size')).toBe('md')
  })

  it('reflects variant and size as data attributes', () => {
    const wrapper = mount(TrustyButton, {
      props: { variant: 'outline', size: 'lg', label: 'Cancel' },
    })
    const el = wrapper.get('button')

    expect(el.attributes('data-variant')).toBe('outline')
    expect(el.attributes('data-size')).toBe('lg')
  })

  it('forwards click handlers and fires them when enabled', async () => {
    const onClick = vi.fn()
    const wrapper = mount(TrustyButton, { props: { label: 'Go' }, attrs: { onClick } })

    await wrapper.get('button').trigger('click')

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables the native button when disabled', () => {
    const wrapper = mount(TrustyButton, { props: { disabled: true, label: 'Nope' } })

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })

  it('shows the loading-spinner icon and marks itself busy while loading', () => {
    const wrapper = mount(TrustyButton, { props: { loading: true, label: 'Saving' } })
    const el = wrapper.get('button')

    expect(el.attributes('aria-busy')).toBe('true')
    expect(el.attributes('disabled')).toBeDefined()
    expect(el.attributes('data-loading')).toBe('true')

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:spinner-gap')
    const spinner = wrapper.get('.trusty-button-spinner')
    expect(spinner.find('svg').exists()).toBe(true)
  })

  it('squares off icon-only buttons (an icon prop, no label)', () => {
    const wrapper = mount(TrustyButton, {
      props: { icon: 'ph:plus' },
      attrs: { 'aria-label': 'Add' },
    })

    expect(wrapper.get('button').attributes('data-icon-only')).toBe('true')
  })

  it('renders at most one icon — the leading one wins over the trailing', () => {
    const wrapper = mount(TrustyButton, {
      props: { leadingIcon: 'ph:plus', trailingIcon: 'ph:caret-right', label: 'Add' },
    })

    const icons = wrapper.findAllComponents(TrustyIcon)
    expect(icons).toHaveLength(1)
    expect(icons[0]!.props('name')).toBe('ph:plus')
  })

  it('renders a trailing icon when no leading icon is set', () => {
    const wrapper = mount(TrustyButton, {
      props: { trailingIcon: 'ph:caret-right', label: 'Continue' },
    })

    const icons = wrapper.findAllComponents(TrustyIcon)
    expect(icons).toHaveLength(1)
    expect(icons[0]!.props('name')).toBe('ph:caret-right')
  })

  it('treats `icon` as a leading-icon shorthand', () => {
    const wrapper = mount(TrustyButton, { props: { icon: 'ph:gear' }, attrs: { 'aria-label': 'Settings' } })
    const el = wrapper.get('button')

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:gear')
    expect(el.attributes('data-icon-only')).toBe('true')
  })
})
