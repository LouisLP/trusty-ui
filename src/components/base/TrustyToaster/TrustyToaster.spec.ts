import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import TrustyToaster from './TrustyToaster.vue'
import { useTrustyToast } from './useTrustyToast'

const { toasts, toast, dismiss, dismissAll } = useTrustyToast()

// The queue is module-level by design, so it outlives a single mount: every test drains it, waiting out the exit delay that keeps a dismissed toast around for its animation.
async function drain() {
  dismissAll()
  await new Promise(resolve => setTimeout(resolve, 250))
  await flushPromises()
}

// Reka mounts the provider/viewport first and teleports the toast in on the next tick.
async function mountToaster() {
  const wrapper = mount(TrustyToaster)
  await flushPromises()
  return wrapper
}

afterEach(drain)

describe('trustyToaster', () => {
  it('renders nothing until a toast is queued', async () => {
    const wrapper = await mountToaster()
    expect(wrapper.find('.toast-base').exists()).toBe(false)
  })

  it('renders a queued toast with its title, description and variant', async () => {
    const wrapper = await mountToaster()
    toast({ title: 'Save failed', description: 'Check your connection.', variant: 'error' })
    await flushPromises()

    const message = wrapper.get('.alert-base')
    expect(message.text()).toContain('Save failed')
    expect(message.text()).toContain('Check your connection.')
    expect(message.attributes('data-variant')).toBe('error')
  })

  it('stacks several toasts in one viewport, in the order they were raised', async () => {
    const wrapper = await mountToaster()
    toast({ title: 'First' })
    toast({ title: 'Second' })
    await flushPromises()

    expect(wrapper.findAll('.toast-base')).toHaveLength(2)
    expect(wrapper.get('.toast-base-viewport').text()).toMatch(/First[\s\S]*Second/)
  })

  it('dismisses one toast by the id toast() returned, leaving the rest', async () => {
    const wrapper = await mountToaster()
    const id = toast({ title: 'First' })
    toast({ title: 'Second' })
    await flushPromises()

    dismiss(id)
    await new Promise(resolve => setTimeout(resolve, 250))
    await flushPromises()

    expect(wrapper.text()).not.toContain('First')
    expect(wrapper.text()).toContain('Second')
  })

  it('drops a toast the close button dismisses', async () => {
    const wrapper = await mountToaster()
    toast({ title: 'Project saved' })
    await flushPromises()

    await wrapper.get('[aria-label="Dismiss"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 250))
    await flushPromises()

    expect(toasts.value).toHaveLength(0)
    expect(wrapper.find('.toast-base').exists()).toBe(false)
  })

  it('clears the whole queue with dismissAll', async () => {
    await mountToaster()
    toast({ title: 'First' })
    toast({ title: 'Second' })
    await flushPromises()

    await drain()
    expect(toasts.value).toHaveLength(0)
  })
})
