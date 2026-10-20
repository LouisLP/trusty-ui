import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyTooltip from './TrustyTooltip.vue'

// Reka renders the tooltip content through a portal into document.body, so we assert against the document rather than the wrapper.
let wrapper: VueWrapper

afterEach(() => {
  wrapper?.unmount()
})

function mountTooltip(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  wrapper = mount(TrustyTooltip, {
    props: { text: 'Helpful hint', ...props },
    slots: { default: '<button type="button">Trigger</button>', ...slots },
    attachTo: document.body,
  })
  return wrapper
}

describe('trustyTooltip', () => {
  it('renders the default slot as the trigger', () => {
    const wrapper = mountTooltip()

    const trigger = wrapper.get('button')
    expect(trigger.text()).toBe('Trigger')
    // as-child merges the wiring onto our button — no extra wrapper button.
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('wires the trigger up for accessibility', () => {
    const wrapper = mountTooltip()
    const trigger = wrapper.get('button')

    expect(trigger.attributes('aria-describedby')).toBeUndefined()
    expect(trigger.attributes('data-state')).toBe('closed')
  })

  it('opens on trigger focus when enabled', async () => {
    const wrapper = mountTooltip()

    await wrapper.get('button').trigger('focus')
    await nextTick()

    expect(document.body.textContent).toContain('Helpful hint')
  })

  it('reflects the side on the content element', async () => {
    const wrapper = mountTooltip({ side: 'right' })

    await wrapper.get('button').trigger('focus')
    await nextTick()

    expect(document.querySelector('.trusty-tooltip')?.getAttribute('data-side')).toBe('right')
  })

  it('passes a wrapping trigger\'s wiring through to the element it wraps', () => {
    // A popover or menu trigger using `as-child` hands its own props down as attrs. They have to reach the button, or the tooltip silently swallows what opens the panel.
    const wrapper = mountTooltip({ 'aria-expanded': 'false', 'data-state': 'closed' })

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('button').attributes('data-state')).toBe('closed')
  })

  it('stays closed on focus while disabled', async () => {
    const wrapper = mountTooltip({ disabled: true })

    await wrapper.get('button').trigger('focus')
    await nextTick()

    expect(document.body.textContent).not.toContain('Helpful hint')
  })
})
