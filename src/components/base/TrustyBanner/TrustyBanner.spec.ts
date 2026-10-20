import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyBanner from './TrustyBanner.vue'

const DISMISS = 'button[aria-label="Dismiss"]'

describe('trustyBanner', () => {
  it('renders title and description', () => {
    const wrapper = mount(TrustyBanner, {
      props: { title: 'Update available', description: 'Version 2.4 is ready to install.' },
    })
    expect(wrapper.get('.alert-base-title').text()).toBe('Update available')
    expect(wrapper.get('.alert-base-description').text()).toBe('Version 2.4 is ready to install.')
  })

  it('defaults to the info variant', () => {
    const wrapper = mount(TrustyBanner, { props: { title: 'Update available' } })
    expect(wrapper.get('.trusty-banner').attributes('data-variant')).toBe('info')
  })

  it('reflects the variant on the root element', () => {
    const wrapper = mount(TrustyBanner, { props: { title: 'Offline', variant: 'error' } })
    expect(wrapper.get('.trusty-banner').attributes('data-variant')).toBe('error')
  })

  it('has no actions row', () => {
    const wrapper = mount(TrustyBanner, { props: { title: 'Update available' } })
    expect(wrapper.find('.trusty-alert-actions').exists()).toBe(false)
  })

  describe('who gets a dismiss button', () => {
    it.each([
      ['info', true],
      ['success', true],
      ['warning', false],
      ['error', false],
    ] as const)('%s: %s by default', (variant, expected) => {
      const wrapper = mount(TrustyBanner, { props: { title: 'Notice', variant } })
      expect(wrapper.find(DISMISS).exists()).toBe(expected)
    })

    it('lets a warning opt in', () => {
      const wrapper = mount(TrustyBanner, {
        props: { title: 'Filters applied', variant: 'warning', dismissible: true },
      })
      expect(wrapper.find(DISMISS).exists()).toBe(true)
    })

    it('lets an info banner opt out', () => {
      const wrapper = mount(TrustyBanner, {
        props: { title: 'Connection lost', dismissible: false },
      })
      expect(wrapper.find(DISMISS).exists()).toBe(false)
    })

    it('keeps an error persistent even when asked to dismiss', () => {
      const wrapper = mount(TrustyBanner, {
        props: { title: 'Connection lost', variant: 'error', dismissible: true },
      })
      expect(wrapper.find(DISMISS).exists()).toBe(false)
    })
  })

  describe('dismissing', () => {
    it('removes the banner and reports the new open state', async () => {
      const wrapper = mount(TrustyBanner, { props: { title: 'Update available' } })

      await wrapper.get(DISMISS).trigger('click')

      expect(wrapper.find('.trusty-banner').exists()).toBe(false)
      expect(wrapper.emitted('update:open')).toStrictEqual([[false]])
    })

    it('renders nothing while open is false', () => {
      const wrapper = mount(TrustyBanner, { props: { title: 'Update available', open: false } })
      expect(wrapper.find('.trusty-banner').exists()).toBe(false)
    })
  })
})
