import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyPopover from './TrustyPopover.vue'

// Reka renders the panel through a portal into document.body, so we assert against the document rather than the wrapper.

function mountPopover(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(TrustyPopover, {
    props: { title: 'Keyframe', ...props },
    slots: {
      trigger: '<button type="button">Open</button>',
      default: '<p>Panel body</p>',
      ...slots,
    },
    attachTo: document.body,
  })
}

describe('trustyPopover', () => {
  it('renders the trigger slot and nothing else while closed', () => {
    const wrapper = mountPopover()

    const trigger = wrapper.get('button')
    expect(trigger.text()).toBe('Open')
    // as-child merges the wiring onto our button — no extra wrapper button.
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(document.querySelector('.trusty-popover')).toBeNull()
  })

  it('opens on trigger click and renders title, description and body', async () => {
    const wrapper = mountPopover({ description: 'Description' })

    await wrapper.get('button').trigger('click')
    await nextTick()

    const panel = document.querySelector('.trusty-popover')
    expect(panel).not.toBeNull()
    expect(panel?.textContent).toContain('Keyframe')
    expect(panel?.textContent).toContain('Description')
    expect(panel?.textContent).toContain('Panel body')
  })

  it('describes the panel with the description, and lets Reka name it from the trigger', async () => {
    const wrapper = mountPopover({ description: 'Description' })
    const triggerId = wrapper.get('button').attributes('id')

    await wrapper.get('button').trigger('click')
    await nextTick()

    const panel = document.querySelector('.trusty-popover')
    const descriptionId = panel?.querySelector('.trusty-popover-description')?.id

    expect(panel?.getAttribute('role')).toBe('dialog')
    expect(descriptionId).toBeTruthy()
    expect(panel?.getAttribute('aria-describedby')).toBe(descriptionId)
    // Reka hardcodes the name to the trigger; documented, not overridable.
    expect(panel?.getAttribute('aria-labelledby')).toBe(triggerId)
  })

  it('leaves aria-describedby off when there is no description', async () => {
    const wrapper = mountPopover()

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(document.querySelector('.trusty-popover')?.getAttribute('aria-describedby')).toBeNull()
  })

  it('omits the header entirely when neither title nor description is given', async () => {
    const wrapper = mountPopover({ title: undefined })

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(document.querySelector('.trusty-popover')).not.toBeNull()
    expect(document.querySelector('.trusty-popover-header')).toBeNull()
  })

  it('reflects the anchored side on the panel', async () => {
    const wrapper = mountPopover({ side: 'right' })

    await wrapper.get('button').trigger('click')
    await nextTick()

    expect(document.querySelector('.trusty-popover')?.getAttribute('data-side')).toBe('right')
  })

  it('opens from v-model without a click', async () => {
    mountPopover({ modelValue: true })
    await nextTick()

    expect(document.querySelector('.trusty-popover')).not.toBeNull()
  })

  it('emits the closed state when dismissed with Escape', async () => {
    const wrapper = mountPopover({ modelValue: true })
    await nextTick()

    await wrapper.get('button').trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
