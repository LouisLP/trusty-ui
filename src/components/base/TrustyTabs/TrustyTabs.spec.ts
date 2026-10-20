import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyTabs from './TrustyTabs.vue'

const TABS = [
  { value: 'account', label: 'Account' },
  { value: 'password', label: 'Password' },
  { value: 'team', label: 'Team' },
]

const SLOTS = {
  account: 'Account panel',
  password: 'Password panel',
  team: 'Team panel',
}

describe('trustyTabs', () => {
  it('renders one trigger per item', () => {
    const wrapper = mount(TrustyTabs, { props: { tabs: TABS }, slots: SLOTS })
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs).toHaveLength(3)
    expect(tabs.map(t => t.text())).toEqual(['Account', 'Password', 'Team'])
  })

  it('activates the first tab by default and shows only its panel', () => {
    const wrapper = mount(TrustyTabs, { props: { tabs: TABS }, slots: SLOTS })

    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('data-state')).toBe('active')
    expect(wrapper.text()).toContain('Account panel')
    expect(wrapper.text()).not.toContain('Password panel')
  })

  it('honours the initial v-model value', () => {
    const wrapper = mount(TrustyTabs, { props: { tabs: TABS, modelValue: 'team' }, slots: SLOTS })

    expect(wrapper.findAll('[role="tab"]')[2]!.attributes('data-state')).toBe('active')
    expect(wrapper.text()).toContain('Team panel')
  })

  it('emits the picked value when a tab is clicked', async () => {
    const wrapper = mount(TrustyTabs, { props: { tabs: TABS, modelValue: 'account' }, slots: SLOTS })

    await wrapper.findAll('[role="tab"]')[1]!.trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['password'])
  })

  it('marks a disabled tab and skips activating it', async () => {
    const tabs = [
      { value: 'account', label: 'Account' },
      { value: 'password', label: 'Password', disabled: true },
    ]
    const wrapper = mount(TrustyTabs, { props: { tabs, modelValue: 'account' }, slots: SLOTS })
    const disabled = wrapper.findAll('[role="tab"]')[1]!

    expect(disabled.attributes('data-disabled')).toBeDefined()

    await disabled.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders no panel for tabs without a slot (strip-only)', () => {
    const wrapper = mount(TrustyTabs, { props: { tabs: TABS, modelValue: 'account' } })

    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)
  })

  it('uses the value as the accessible name for icon-only tabs', () => {
    const wrapper = mount(TrustyTabs, {
      props: { tabs: [{ value: 'account', icon: 'ph:gear' }] },
      slots: { account: 'x' },
    })
    const tab = wrapper.get('[role="tab"]')

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:gear')
    expect(tab.attributes('aria-label')).toBe('account')
    expect(tab.attributes('data-icon-only')).toBe('true')
  })

  it('derives vertical orientation from a side placement', () => {
    const wrapper = mount(TrustyTabs, {
      props: { tabs: TABS, placement: 'left' },
      slots: SLOTS,
    })
    const root = wrapper.get('.trusty-tabs')

    expect(root.attributes('data-placement')).toBe('left')
    expect(root.attributes('data-orientation')).toBe('vertical')
  })

  it('keeps horizontal orientation for top placement', () => {
    const wrapper = mount(TrustyTabs, {
      props: { tabs: TABS, placement: 'top' },
      slots: SLOTS,
    })

    expect(wrapper.get('.trusty-tabs').attributes('data-orientation')).toBe('horizontal')
  })
})
