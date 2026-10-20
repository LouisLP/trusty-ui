import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyToast from './TrustyToast.vue'

// Reka mounts the provider/viewport first and flips the toast open on the next tick, so open-dependent assertions wait for that to settle.
function openToast(props: {
  title: string
  description?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
}) {
  const wrapper = mount(TrustyToast, { props: { open: true, ...props } })
  return flushPromises().then(() => wrapper)
}

describe('trustyToast', () => {
  it('renders title and description when open', async () => {
    const wrapper = await openToast({ title: 'Saved', description: 'All good' })
    const toast = wrapper.get('.toast-base')
    expect(toast.text()).toContain('Saved')
    expect(toast.text()).toContain('All good')
  })

  it('omits the description when none is given', async () => {
    const wrapper = await openToast({ title: 'Copied' })
    expect(wrapper.find('.alert-base-description').exists()).toBe(false)
  })

  it('does not render while closed', async () => {
    const wrapper = mount(TrustyToast, { props: { open: false, title: 'Saved' } })
    await flushPromises()
    expect(wrapper.find('.toast-base').exists()).toBe(false)
  })

  it('reflects the variant on the message surface', async () => {
    const wrapper = await openToast({ title: 'Save failed', variant: 'error' })
    expect(wrapper.get('.alert-base').attributes('data-variant')).toBe('error')
  })

  // Reka's own live region announces the toast, so the message inside must not be a second one.
  it('leaves the live region to the toast primitive', async () => {
    const wrapper = await openToast({ title: 'Save failed', variant: 'error' })
    expect(wrapper.get('.alert-base').attributes('role')).toBeUndefined()
  })

  it('emits update:open=false when the close button is clicked', async () => {
    const wrapper = await openToast({ title: 'Saved' })
    await wrapper.get('[aria-label="Dismiss"]').trigger('click')
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })
})
