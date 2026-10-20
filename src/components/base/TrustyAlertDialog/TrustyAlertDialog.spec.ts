import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyAlertDialog from './TrustyAlertDialog.vue'

// Reka portals the overlay + content into document.body, so we assert against the document rather than the wrapper.

function mountAlertDialog(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(TrustyAlertDialog, {
    props: { title: 'Delete this file?', ...props },
    slots: { trigger: '<button type="button">Delete</button>', ...slots },
    attachTo: document.body,
  })
}

// Scope to the footer so a trigger that happens to share a label doesn't match.
function findButton(label: string): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>('.trusty-alert-dialog-footer button')]
    .find(b => b.textContent?.trim() === label)
}

describe('trustyAlertDialog', () => {
  it('renders the trigger slot without wrapping it in an extra element', () => {
    const wrapper = mountAlertDialog()

    expect(wrapper.get('button').text()).toBe('Delete')
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('renders title, description and the fixed Cancel/Delete buttons when opened', async () => {
    mountAlertDialog({ modelValue: true, description: 'This cannot be undone.' })
    await nextTick()

    expect(document.body.textContent).toContain('Delete this file?')
    expect(document.body.textContent).toContain('This cannot be undone.')
    expect(findButton('Cancel')).toBeTruthy()
    expect(findButton('Delete')).toBeTruthy()
  })

  it('emits confirm and closes when the confirm button is clicked', async () => {
    const wrapper = mountAlertDialog({ modelValue: true })
    await nextTick()

    findButton('Delete')?.click()
    await nextTick()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('emits cancel and closes when the cancel button is clicked', async () => {
    const wrapper = mountAlertDialog({ modelValue: true })
    await nextTick()

    findButton('Cancel')?.click()
    await nextTick()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
