import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import DialogBase from './DialogBase.vue'

// Reka portals the overlay + content into document.body, so we assert against the document rather than the wrapper.

// Private primitive; the public wrappers (e.g. TrustyDialog) cover the full dialog UX end-to-end. These tests pin only the contract the wrappers rely on: trigger passthrough, open/close model, and the default slot's `close`.
describe('dialogBase', () => {
  it('renders the trigger slot without wrapping it in an extra element', () => {
    const wrapper = mount(DialogBase, {
      slots: { trigger: '<button type="button">Open</button>' },
    })

    expect(wrapper.get('button').text()).toBe('Open')
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('stays closed by default', () => {
    mount(DialogBase, { slots: { default: '<p>Body</p>' } })

    expect(document.body.textContent).not.toContain('Body')
  })

  it('renders the default slot when opened via v-model', async () => {
    mount(DialogBase, {
      props: { modelValue: true },
      slots: { default: '<p>Body</p>' },
      attachTo: document.body,
    })
    await nextTick()

    expect(document.body.textContent).toContain('Body')
  })

  it('passes a `close` helper to the default slot that clears the model', async () => {
    const wrapper = mount(DialogBase, {
      props: { modelValue: true },
      slots: { default: '<template #default="{ close }"><button type="button" @click="close">Dismiss</button></template>' },
      attachTo: document.body,
    })
    await nextTick()

    document.querySelector<HTMLButtonElement>('button')?.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })
})
