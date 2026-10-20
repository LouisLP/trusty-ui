import type { ToastBaseItem } from './ToastBase.types'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ToastBase from './ToastBase.vue'

// Private host; TrustyToast and TrustyToaster cover the toast UX end-to-end. These pin the list contract both feed it: one toast per open item, and `close` carrying the item's id.
function mountHost(toasts: ToastBaseItem[]) {
  const wrapper = mount(ToastBase, { props: { toasts } })
  return flushPromises().then(() => wrapper)
}

describe('toastBase', () => {
  it('renders one toast per open item, in order', async () => {
    const wrapper = await mountHost([
      { id: 'a', title: 'First', open: true },
      { id: 'b', title: 'Second', open: true },
      { id: 'c', title: 'Gone', open: false },
    ])
    expect(wrapper.findAll('.toast-base').map(t => t.text())).toEqual(['First', 'Second'])
  })

  it('emits close with the dismissed item\'s id', async () => {
    const wrapper = await mountHost([
      { id: 'a', title: 'First', open: true },
      { id: 'b', title: 'Second', open: true },
    ])
    await wrapper.findAll('[aria-label="Dismiss"]')[1]!.trigger('click')
    expect(wrapper.emitted('close')).toEqual([['b']])
  })
})
