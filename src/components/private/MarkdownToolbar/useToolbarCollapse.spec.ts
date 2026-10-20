import type { ToolbarLayout } from './MarkdownToolbar.responsive'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { MARKDOWN_TOOLBAR_GROUPS } from './MarkdownToolbar.actions'
import { FALLBACK_WIDTHS, readToolbarLayout } from './MarkdownToolbar.responsive'
import { useToolbarCollapse } from './useToolbarCollapse'

// The collapse path, end to end. jsdom's ResizeObserver is a no-op stub and its elements have no layout, so both the observer and the measurement are injected here.

/** A ResizeObserver that hands the width back on demand. */
function stubResizeObserver() {
  let notify: ((width: number) => void) | undefined
  class Stub {
    observe() {}
    unobserve() {}
    disconnect() {}

    constructor(callback: ResizeObserverCallback) {
      notify = (width: number) =>
        callback(
          [{ borderBoxSize: [{ inlineSize: width, blockSize: 0 }] } as unknown as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        )
    }
  }
  vi.stubGlobal('ResizeObserver', Stub)
  return {
    resizeTo: (width: number) => notify?.(width),
    restore: () => vi.unstubAllGlobals(),
  }
}

function mountCollapse(readLayout?: (bar: HTMLElement) => ToolbarLayout | undefined) {
  const level = ref(0)
  const visible = ref<string[]>([])
  const collapsed = ref<string[]>([])

  const wrapper = mount(defineComponent({
    setup() {
      const element = ref<HTMLElement>()
      const collapse = useToolbarCollapse({ element: () => element.value, readLayout })
      return () => {
        level.value = collapse.level.value
        visible.value = collapse.visible.value.map(group => group.name)
        collapsed.value = collapse.collapsed.value.map(group => group.name)
        return h('div', {
          ref: (el) => {
            element.value = el as HTMLElement
          },
        })
      }
    },
  }), { attachTo: document.body })

  return { wrapper, level, visible, collapsed }
}

describe('useToolbarCollapse', () => {
  it('starts with everything on the bar', () => {
    const observer = stubResizeObserver()
    const { wrapper, visible, collapsed } = mountCollapse(() => undefined)

    expect(visible.value).toEqual(MARKDOWN_TOOLBAR_GROUPS.map(group => group.name))
    expect(collapsed.value).toEqual([])

    wrapper.unmount()
    observer.restore()
  })

  it('folds groups as the bar narrows, and unfolds them as it widens', async () => {
    const observer = stubResizeObserver()
    // Thresholds: 800 / 730 / 630 / 530 — the same shape widthsFromLayout gives.
    const { wrapper, level, collapsed } = mountCollapse(() => ({
      total: 800,
      removalCost: { Blocks: 100, Headings: 100, Lists: 100 },
      overflowCost: 30,
    }))

    observer.resizeTo(900)
    await nextTick()
    expect(level.value).toBe(0)

    observer.resizeTo(760)
    await nextTick()
    expect(level.value).toBe(1)
    expect(collapsed.value).toEqual(['Blocks'])

    // 650 clears the 630 threshold but not the 730 one: two folded, reported in the bar's order rather than the order they folded.
    observer.resizeTo(650)
    await nextTick()
    expect(collapsed.value).toEqual(['Headings', 'Blocks'])

    // Below the last threshold everything foldable is folded.
    observer.resizeTo(400)
    await nextTick()
    expect(collapsed.value).toEqual(['Headings', 'Blocks', 'Lists'])

    // And back out again — folding is not one-way.
    observer.resizeTo(900)
    await nextTick()
    expect(level.value).toBe(0)

    wrapper.unmount()
    observer.restore()
  })

  it('never folds emphasis, which is what the bar is for', async () => {
    const observer = stubResizeObserver()
    const { wrapper, visible } = mountCollapse(() => undefined)

    observer.resizeTo(0)
    await nextTick()
    expect(visible.value).toEqual(['Emphasis'])

    wrapper.unmount()
    observer.restore()
  })

  it('falls back to the constants when the bar cannot be measured', async () => {
    // On a bar that has not been laid out the measured thresholds are unavailable, so the hand-copied ones stand in.
    const observer = stubResizeObserver()
    const { wrapper, level } = mountCollapse(() => undefined)

    observer.resizeTo(FALLBACK_WIDTHS[0]!)
    await nextTick()
    expect(level.value).toBe(0)

    observer.resizeTo(FALLBACK_WIDTHS[0]! - 1)
    await nextTick()
    expect(level.value).toBe(1)

    wrapper.unmount()
    observer.restore()
  })

  it('prefers measured thresholds over the constants', async () => {
    // The fallback constants can say the bar fits where the browser disagrees, and it grows a second row. A measured bar folds instead.
    const observer = stubResizeObserver()
    const { wrapper, level } = mountCollapse(() => ({
      total: 2000,
      removalCost: { Blocks: 100, Headings: 100, Lists: 100 },
      overflowCost: 30,
    }))

    // Comfortably above every fallback threshold, but below the measured one.
    observer.resizeTo(FALLBACK_WIDTHS[0]! + 10)
    await nextTick()
    expect(level.value).toBeGreaterThan(0)

    wrapper.unmount()
    observer.restore()
  })

  it('stops observing on unmount', () => {
    const observer = stubResizeObserver()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect = disconnect
    })

    const { wrapper } = mountCollapse(() => undefined)
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalled()
    observer.restore()
  })
})

describe('readToolbarLayout', () => {
  it('declines to measure a bar whose groups are not all rendered', () => {
    const bar = document.createElement('div')
    bar.innerHTML = '<div data-toolbar-group="Emphasis"></div>'
    document.body.append(bar)

    // Fewer groups than the bar has: not measurable, so the caller falls back.
    expect(readToolbarLayout(bar)).toBeUndefined()
    bar.remove()
  })

  it('declines to measure a bar with no layout at all', () => {
    // jsdom gives every element a zero rect, which is exactly the "not laid out yet" case this guard exists for.
    const bar = document.createElement('div')
    bar.innerHTML = MARKDOWN_TOOLBAR_GROUPS
      .map(group => `<div data-toolbar-group="${group.name}"></div>`)
      .join('')
    document.body.append(bar)

    expect(readToolbarLayout(bar)).toBeUndefined()
    bar.remove()
  })

  it('reports total width, per-group removal cost and the overflow cost', () => {
    const bar = document.createElement('div')
    bar.innerHTML = `${MARKDOWN_TOOLBAR_GROUPS
      .map(group => `<div data-toolbar-group="${group.name}"></div>`)
      .join('')}<button class="markdown-toolbar-item"></button>`
    document.body.append(bar)

    // Lay the groups out by hand: 100 wide, 10 apart, starting at 0.
    const groups = [...bar.querySelectorAll<HTMLElement>('[data-toolbar-group]')]
    groups.forEach((group, index) => {
      const left = index * 110
      group.getBoundingClientRect = () =>
        ({ left, right: left + 100, width: 100 }) as DOMRect
    })
    bar.querySelector<HTMLElement>('.markdown-toolbar-item')!.getBoundingClientRect = () =>
      ({ width: 24 }) as DOMRect

    const layout = readToolbarLayout(bar)!
    expect(layout).toBeDefined()
    // First group's left to the last group's right, plus jsdom's zero padding.
    expect(layout.total).toBe((groups.length - 1) * 110 + 100)
    // Each foldable group frees its own width plus the gap beside it.
    expect(layout.removalCost.Blocks).toBe(110)
    expect(layout.overflowCost).toBe(24)
    // Emphasis never folds, so it has no removal cost.
    expect(layout.removalCost.Emphasis).toBeUndefined()

    bar.remove()
  })
})
