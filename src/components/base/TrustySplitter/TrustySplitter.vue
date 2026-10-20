<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/splitter#splitter

import type { PropType, VNode } from 'vue'
import { SplitterGroup, SplitterResizeHandle } from 'reka-ui'
import { Comment, defineComponent, Fragment, h, Text, useSlots } from 'vue'

type TrustySplitterDirection = 'horizontal' | 'vertical'

withDefaults(defineProps<{
  /** Lay the panels out horizontally or vertically (defaults to horizontal) */
  direction?: TrustySplitterDirection
  /** localStorage key under which the panel layout is remembered across reloads. Omit it and the layout resets to the panels' defaultSize each mount. Must be unique per splitter across the whole app — a saved layout always wins over defaultSize. */
  autoSaveId?: string
}>(), {
  direction: 'horizontal',
})

const slots = useSlots()

// Flatten the default slot down to its real panel VNodes
function flattenPanels(nodes: VNode[] = []): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Comment)
      return []
    if (node.type === Text && typeof node.children === 'string' && !node.children.trim())
      return []
    if (node.type === Fragment)
      return flattenPanels(node.children as VNode[])
    return [node]
  })
}

// Automatically place handles between panels. Otherwise, we'd need a 3rd component that consumers would have to remember to use. This way, consumers just place <TrustySplitterPanel>s and the handles are inserted automatically. Called from the template as a root-level dynamic prop so it re-runs on EVERY re-render of this component.
function buildLayout(): VNode[] {
  return flattenPanels(slots.default?.()).flatMap((panel, index) =>
    index === 0
      ? [panel]
      : [
          h(
            SplitterResizeHandle,
            { key: `trusty-splitter-handle-${index}`, class: 'trusty-splitter-handle' },
            () => h(
              'span',
              { 'class': 'trusty-splitter-grip', 'aria-hidden': 'true' },
              Array.from({ length: 4 }, () => h('span', { class: 'trusty-splitter-dot' })),
            ),
          ),
          panel,
        ],
  )
}

// Renders the SplitterGroup with MANUAL (non-stable) slots. Placing the panels inside <SplitterGroup> in the template instead would compile them as a "stable" slot, and Vue's stable-slot optimization would skip re-rendering SplitterGroup when this component re-renders with new slot content
const SplitterGroupRenderer = defineComponent({
  name: 'TrustySplitterGroupRenderer',
  props: {
    direction: { type: String as PropType<TrustySplitterDirection>, required: true },
    autoSaveId: { type: String, default: undefined },
    nodes: { type: Array as PropType<VNode[]>, required: true },
  },
  setup(rendererProps) {
    return () => h(
      SplitterGroup,
      {
        direction: rendererProps.direction,
        autoSaveId: rendererProps.autoSaveId,
        class: 'trusty-splitter',
      },
      { default: () => rendererProps.nodes },
    )
  },
})
</script>

<template>
  <SplitterGroupRenderer
    :direction="direction"
    :auto-save-id="autoSaveId"
    :nodes="buildLayout()"
  />
</template>

<style scoped>
/* SplitterGroup already applies display:flex + the row/column direction inline; we only need the box to fill its parent and clip the panels. */
.trusty-splitter {
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
}

/* The handles/grips are h()-rendered slot content of Reka's SplitterGroup, so they sit behind a component boundary — reach them with :deep(), matched by the unique `trusty-splitter-*` classes. */

/* A visible divider bar; Reka widens the pointer hit area beyond it. The bar switches to the accent on hover, drag, and keyboard focus. */
:deep(.trusty-splitter-handle) {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-lowered);
  transition: background-color var(--duration-fast) ease-out;
}

:deep(.trusty-splitter-handle[data-orientation='horizontal']) {
  inline-size: var(--space-xs);
  cursor: col-resize;
}

:deep(.trusty-splitter-handle[data-orientation='vertical']) {
  block-size: var(--space-xs);
  cursor: row-resize;
}

:deep(.trusty-splitter-handle:hover),
:deep(.trusty-splitter-handle:focus-visible),
:deep(.trusty-splitter-handle[data-resize-handle-state='hover']),
:deep(.trusty-splitter-handle[data-resize-handle-state='drag']) {
  background-color: var(--color-primary);
}

:deep(.trusty-splitter-handle:hover .trusty-splitter-dot),
:deep(.trusty-splitter-handle:focus-visible .trusty-splitter-dot),
:deep(.trusty-splitter-handle[data-resize-handle-state='hover'] .trusty-splitter-dot),
:deep(.trusty-splitter-handle[data-resize-handle-state='drag'] .trusty-splitter-dot) {
  background-color: var(--color-text);
}

/* Keyboard focus ring, hidden for pointer focus (matches TrustyButton). */
:deep(.trusty-splitter-handle:focus) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

:deep(.trusty-splitter-handle:focus:not(:focus-visible)) {
  outline-color: transparent;
}

/* A four-dot grip so the divider clearly reads as draggable. */
:deep(.trusty-splitter-grip) {
  display: flex;
  gap: var(--space-2xs);
}

:deep(.trusty-splitter-handle[data-orientation='horizontal'] .trusty-splitter-grip) {
  flex-direction: column;
}

:deep(.trusty-splitter-dot) {
  inline-size: var(--space-2xs);
  block-size: var(--space-2xs);
  background-color: var(--color-text-muted);
  border-radius: var(--radius-full);
  transition: background-color var(--duration-fast) ease-out;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.trusty-splitter-handle),
  :deep(.trusty-splitter-dot) {
    transition: none;
  }
}
</style>
