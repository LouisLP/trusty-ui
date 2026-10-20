import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyNavigationTabs from './TrustyNavigationTabs.vue'

const TABS = [
  { value: 'preferences', label: 'Preferences' },
  { value: 'account', label: 'Account' },
  { value: 'privacy', label: 'Privacy' },
]

const SLOTS = {
  preferences: 'Preferences panel',
  account: 'Account panel',
  privacy: 'Privacy panel',
}

describe('trustyNavigationTabs', () => {
  it('renders one trigger per item', () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS }, slots: SLOTS })
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs).toHaveLength(3)
    expect(tabs.map(t => t.text())).toEqual(['Preferences', 'Account', 'Privacy'])
  })

  it('activates the first tab by default and shows only its panel', () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS }, slots: SLOTS })

    expect(wrapper.findAll('[role="tab"]')[0]!.attributes('data-state')).toBe('active')
    expect(wrapper.text()).toContain('Preferences panel')
    expect(wrapper.text()).not.toContain('Account panel')
  })

  it('honours the initial v-model value', () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS, modelValue: 'privacy' }, slots: SLOTS })

    expect(wrapper.findAll('[role="tab"]')[2]!.attributes('data-state')).toBe('active')
    expect(wrapper.text()).toContain('Privacy panel')
  })

  it('emits the picked value when a tab is clicked', async () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS, modelValue: 'preferences' }, slots: SLOTS })

    await wrapper.findAll('[role="tab"]')[1]!.trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['account'])
  })

  it('marks a disabled tab and skips activating it', async () => {
    const tabs = [
      { value: 'preferences', label: 'Preferences' },
      { value: 'account', label: 'Account', disabled: true },
    ]
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs, modelValue: 'preferences' }, slots: SLOTS })
    const disabled = wrapper.findAll('[role="tab"]')[1]!

    expect(disabled.attributes('data-disabled')).toBeDefined()

    await disabled.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders no panel for tabs without a slot (rail-only)', () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS, modelValue: 'preferences' } })

    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)
  })

  it('uses the value as the accessible name for icon-only tabs', () => {
    const wrapper = mount(TrustyNavigationTabs, {
      props: { tabs: [{ value: 'account', icon: 'ph:gear' }] },
      slots: { account: 'x' },
    })
    const tab = wrapper.get('[role="tab"]')

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:gear')
    expect(tab.attributes('aria-label')).toBe('account')
    expect(tab.attributes('data-icon-only')).toBe('true')
  })

  it('is always a vertical rail, so arrow keys run up and down', () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS }, slots: SLOTS })

    expect(wrapper.get('.trusty-navigation-tabs').attributes('data-orientation')).toBe('vertical')
    expect(wrapper.get('[role="tablist"]').attributes('aria-orientation')).toBe('vertical')
  })

  it('docks left by default and flips the flow when docked right', () => {
    const left = mount(TrustyNavigationTabs, { props: { tabs: TABS }, slots: SLOTS })
    const right = mount(TrustyNavigationTabs, { props: { tabs: TABS, placement: 'right' }, slots: SLOTS })

    expect(left.get('.trusty-navigation-tabs').attributes('data-placement')).toBe('left')
    expect(right.get('.trusty-navigation-tabs').attributes('data-placement')).toBe('right')
  })

  it('reflects the size for the per-size styling to hang off', () => {
    const wrapper = mount(TrustyNavigationTabs, { props: { tabs: TABS, size: 'xl' }, slots: SLOTS })

    expect(wrapper.get('.trusty-navigation-tabs').attributes('data-size')).toBe('xl')
  })
})
