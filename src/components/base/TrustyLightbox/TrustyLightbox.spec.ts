import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyLightbox from './TrustyLightbox.vue'

// Reka portals the overlay + content into document.body, so we assert against the document rather than the wrapper.

function mountModal(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(TrustyLightbox, {
    props: { title: 'Preview', ...props },
    slots: { trigger: '<button type="button">Open</button>', ...slots },
    attachTo: document.body,
  })
}

describe('trustyLightbox', () => {
  it('renders the trigger slot without wrapping it in an extra element', () => {
    const wrapper = mountModal()

    expect(wrapper.get('button').text()).toBe('Open')
    // as-child merges the wiring onto our button — no extra wrapper button.
    expect(wrapper.findAll('button')).toHaveLength(1)
  })

  it('stays closed by default', () => {
    mountModal({}, { default: '<img src="image.png" alt="Preview">' })

    expect(document.querySelector('img')).toBeNull()
  })

  it('renders the default slot content when opened via v-model', async () => {
    mountModal(
      { modelValue: true },
      { trigger: '<button type="button">Open</button>', default: '<img src="image.png" alt="Preview">' },
    )
    await nextTick()

    expect(document.querySelector('img')?.getAttribute('src')).toBe('image.png')
  })

  it('renders the title as a centered caption below the image', async () => {
    mountModal({ modelValue: true })
    await nextTick()

    expect(document.querySelector('.trusty-lightbox-title')?.textContent?.trim()).toBe('Preview')
  })

  it('renders an icon-only Close button', async () => {
    mountModal({ modelValue: true })
    await nextTick()

    const closeButton = document.querySelector<HTMLButtonElement>('[aria-label="Close"]')
    expect(closeButton).not.toBeNull()
    expect(closeButton?.textContent?.trim()).toBe('')
  })

  it('emits update:modelValue=false when the close button is clicked', async () => {
    const wrapper = mountModal({ modelValue: true })
    await nextTick()

    document.querySelector<HTMLButtonElement>('[aria-label="Close"]')?.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
  })

  it('renders its content inside the lightbox container', async () => {
    mountModal({ modelValue: true })
    await nextTick()

    expect(document.querySelector('.trusty-lightbox')).not.toBeNull()
  })
})
