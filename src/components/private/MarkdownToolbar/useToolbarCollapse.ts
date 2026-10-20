/**
 * How much of the toolbar fits, behind one call: measure the bar, turn the measurements into thresholds, and report which groups that leaves visible.
 *
 * The measurement is an injected adapter, which is what makes the sequence testable — the real DOM reader in production, a stub in a test.
 */

import type { ComputedRef, Ref } from 'vue'
import type { MarkdownToolbarGroup } from './MarkdownToolbar.actions'
import type { ToolbarLayout } from './MarkdownToolbar.responsive'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  collapsedGroups,
  collapseLevelFor,
  FALLBACK_WIDTHS,
  readToolbarLayout,
  visibleGroups,
  widthsFromLayout,
} from './MarkdownToolbar.responsive'

export interface UseToolbarCollapseOptions {
  /** The bar element. Read on mount, once it is laid out. */
  element: () => HTMLElement | undefined
  /** Read the bar's own layout. Defaults to measuring the real DOM; a test passes a stub, since jsdom's ResizeObserver is a no-op and its elements have no layout. */
  readLayout?: (bar: HTMLElement) => ToolbarLayout | undefined
}

export interface ToolbarCollapse {
  /** How many groups have folded away. */
  level: Ref<number>
  /** The groups still on the bar. */
  visible: ComputedRef<MarkdownToolbarGroup[]>
  /** The groups in the overflow menu, in the bar's own order. */
  collapsed: ComputedRef<MarkdownToolbarGroup[]>
}

export function useToolbarCollapse(options: UseToolbarCollapseOptions): ToolbarCollapse {
  const readLayout = options.readLayout ?? readToolbarLayout

  const level = ref(0)
  /** The thresholds this bar actually folds at — measured, or the fallback. */
  let widths: number[] = FALLBACK_WIDTHS
  let observer: ResizeObserver | undefined

  function resize(width: number) {
    level.value = collapseLevelFor(width, widths)
  }

  onMounted(() => {
    const bar = options.element()
    if (!bar || typeof ResizeObserver === 'undefined') {
      return
    }

    // Before the observer, while nothing has folded and every group is still there to be measured.
    const layout = readLayout(bar)
    widths = layout ? widthsFromLayout(layout) : FALLBACK_WIDTHS

    observer = new ResizeObserver(([entry]) => {
      const width = entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.contentRect.width
      if (width !== undefined) {
        resize(width)
      }
    })
    observer.observe(bar, { box: 'border-box' })
  })

  onBeforeUnmount(() => observer?.disconnect())

  return {
    level,
    visible: computed(() => visibleGroups(level.value)),
    collapsed: computed(() => collapsedGroups(level.value)),
  }
}
