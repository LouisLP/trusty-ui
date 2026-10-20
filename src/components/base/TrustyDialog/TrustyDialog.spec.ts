import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyDialog from './TrustyDialog.vue'

// Reka portals the overlay + content into document.body, so we assert against the document rather than the wrapper.

function mountDialog(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(TrustyDialog, {
    props: { title: 'Rename project', ...props },
    slots: { trigger: '<button type="button">Open</button>', ...slots },
    attachTo: document.body,
  })
}

describe('trustyDialog', () => {
  it('renders the trigger slot without wrapping it in an extra element', () => {
    const wrapper = mountDialog()

    expect(wrapper.get('button').text()).toBe('Open')
    // as-child merges the wiring onto our button — no extra wrapper button.
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('stays closed by default', () => {
    mountDialog()

    expect(document.body.textContent).not.toContain('Rename project')
  })

  it('renders title, description and body when opened via v-model', async () => {
    mountDialog(
      { modelValue: true, description: 'Pick a clear name.' },
      { trigger: '<button type="button">Open</button>', default: '<p>Body text</p>' },
    )
    await nextTick()

    expect(document.body.textContent).toContain('Rename project')
    expect(document.body.textContent).toContain('Pick a clear name.')
    expect(document.body.textContent).toContain('Body text')
  })

  it('renders an accessible close button', async () => {
    mountDialog({ modelValue: true })
    await nextTick()

    expect(document.querySelector('[aria-label="Close dialog"]')).not.toBeNull()
  })

  it('emits update:modelValue=false when the close button is clicked', async () => {
    const wrapper = mountDialog({ modelValue: true })
    await nextTick()

    document.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]')?.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('omits the description when none is given', async () => {
    mountDialog({ modelValue: true })
    await nextTick()

    expect(document.querySelector('.trusty-dialog-description')).toBeNull()
  })
})
