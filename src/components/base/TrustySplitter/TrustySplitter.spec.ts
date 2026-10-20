import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import TrustySplitter from './TrustySplitter.vue'
import TrustySplitterPanel from './TrustySplitterPanel.vue'

function mountSplitter(props: Record<string, unknown> = {}, panelCount = 2) {
  return mount(TrustySplitter, {
    props,
    slots: {
      default: () =>
        Array.from({ length: panelCount }, (_, i) =>
          h(TrustySplitterPanel, null, () => `Panel ${i + 1}`)),
    },
    attachTo: document.body,
  })
}

describe('trustySplitter', () => {
  it('renders one panel per slotted child', () => {
    const wrapper = mountSplitter({}, 3)
    expect(wrapper.findAllComponents(TrustySplitterPanel)).toHaveLength(3)
    expect(wrapper.text()).toContain('Panel 1')
    expect(wrapper.text()).toContain('Panel 3')
  })

  it('inserts a resize handle between every adjacent pair of panels', () => {
    const wrapper = mountSplitter({}, 3)
    // 3 panels → 2 handles (none before the first).
    const handles = wrapper.findAll('[data-resize-handle]')
    expect(handles).toHaveLength(2)
    expect(handles[0]!.attributes('role')).toBe('separator')
  })

  it('defaults to a horizontal group', () => {
    const wrapper = mountSplitter()
    expect(wrapper.get('[data-panel-group]').attributes('data-orientation')).toBe('horizontal')
  })

  it('reflects the vertical direction on the group', () => {
    const wrapper = mountSplitter({ direction: 'vertical' })
    expect(wrapper.get('[data-panel-group]').attributes('data-orientation')).toBe('vertical')
  })

  describe('layout persistence', () => {
    // Reka writes the layout back debounced. A fixed sleep races that timer (and a late write then leaks into the NEXT test), so the positive case polls until the write lands, and every case unmounts its splitter so no pending write survives the test.
    let wrapper: ReturnType<typeof mountSplitter> | undefined

    afterEach(() => {
      wrapper?.unmount()
      wrapper = undefined
      vi.restoreAllMocks()
      localStorage.clear()
    })

    it('persists the layout under the given autoSaveId', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      wrapper = mountSplitter({ autoSaveId: 'my-splitter' })
      await vi.waitFor(
        () => expect(setItem).toHaveBeenCalledWith(expect.stringContaining('my-splitter'), expect.any(String)),
        { timeout: 2000 },
      )
    })

    it('skips persistence when autoSaveId is omitted', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      wrapper = mountSplitter()
      // No signal to await for a non-event: give the (never-scheduled) debounce comfortably longer than Reka's 100ms before asserting silence.
      await new Promise(resolve => setTimeout(resolve, 300))
      expect(setItem).not.toHaveBeenCalled()
    })
  })

  it('adds and removes panels when the slot content changes across parent re-renders', async () => {
    const show = ref(false)
    const Wrapper = defineComponent({
      setup() {
        return () => {
          const visible = show.value
          return h(TrustySplitter, null, {
            default: () => [
              h(TrustySplitterPanel, null, () => 'One'),
              visible ? h(TrustySplitterPanel, null, () => 'Two') : null,
            ],
          })
        }
      },
    })
    const wrapper = mount(Wrapper, { attachTo: document.body })
    expect(wrapper.findAll('[data-panel]')).toHaveLength(1)

    show.value = true
    await nextTick()
    expect(wrapper.findAll('[data-panel]')).toHaveLength(2)
    expect(wrapper.findAll('[data-resize-handle]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Two')

    show.value = false
    await nextTick()
    expect(wrapper.findAll('[data-panel]')).toHaveLength(1)
    expect(wrapper.findAll('[data-resize-handle]')).toHaveLength(0)
  })

  it('skips v-if comments rather than treating them as panels', () => {
    const wrapper = mount(TrustySplitter, {
      slots: { default: () => [h(TrustySplitterPanel, null, () => 'Only'), null] },
      attachTo: document.body,
    })
    expect(wrapper.findAllComponents(TrustySplitterPanel)).toHaveLength(1)
    expect(wrapper.findAll('[data-resize-handle]')).toHaveLength(0)
  })
})
