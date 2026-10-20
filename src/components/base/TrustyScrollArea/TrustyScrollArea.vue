<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/scroll-area#scrollarea

import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from 'reka-ui'
import { computed } from 'vue'

type TrustyScrollAreaAxis = 'vertical' | 'horizontal' | 'both'

const props = withDefaults(defineProps<{
  /** Which scrollbars can appear: vertical, horizontal, or both (defaults to vertical) */
  axis?: TrustyScrollAreaAxis
}>(), {
  axis: 'vertical',
})

const showVertical = computed(() => props.axis !== 'horizontal')
const showHorizontal = computed(() => props.axis !== 'vertical')

// Scrollbars reveal on hover/scroll, then linger this long before hiding
const SCROLL_HIDE_DELAY_MS = 600
</script>

<template>
  <ScrollAreaRoot
    class="trusty-scroll-area"
    type="hover"
    :scroll-hide-delay="SCROLL_HIDE_DELAY_MS"
  >
    <ScrollAreaViewport class="trusty-scroll-area-viewport">
      <slot />
    </ScrollAreaViewport>

    <ScrollAreaScrollbar
      v-if="showVertical"
      orientation="vertical"
      class="trusty-scroll-area-scrollbar"
    >
      <ScrollAreaThumb class="trusty-scroll-area-thumb" />
    </ScrollAreaScrollbar>

    <ScrollAreaScrollbar
      v-if="showHorizontal"
      orientation="horizontal"
      class="trusty-scroll-area-scrollbar"
    >
      <ScrollAreaThumb class="trusty-scroll-area-thumb" />
    </ScrollAreaScrollbar>

    <ScrollAreaCorner v-if="showVertical && showHorizontal" />
  </ScrollAreaRoot>
</template>

<style scoped>
/* Only ScrollAreaRoot's element receives Vue's scoped data-v attribute — Reka renders the Viewport, Scrollbar and Thumb roots itself, so only their `class` falls through and a normal scoped selector would silently miss them. Hence :global(), matching by the unique `trusty-scroll-area-*` class alone. */

/* Reka's root sets no height of its own, so without this it grows to fit its content and spills past the parent (nothing ever scrolls). Filling the parent's height is the contract: constrain the parent, the viewport scrolls. */
.trusty-scroll-area {
  block-size: 100%;
  overflow: hidden;
}

:deep(.trusty-scroll-area-viewport) {
  inline-size: 100%;
  block-size: 100%;
  border-radius: inherit;
}

:deep(.trusty-scroll-area-scrollbar) {
  display: flex;
  padding: var(--space-2xs);
  /* stylelint-disable-next-line plugin/no-unsupported-browser-features */
  touch-action: none;
  user-select: none;
  background-color: transparent;
  transition: background-color var(--duration-normal) ease-out;
}

:deep(.trusty-scroll-area-scrollbar:hover),
:deep(.trusty-scroll-area-scrollbar:focus) {
  background-color: var(--color-bg-lowered);
}

:deep(.trusty-scroll-area-scrollbar[data-orientation='vertical']) {
  inline-size: var(--space-sm);
}

:deep(.trusty-scroll-area-scrollbar[data-orientation='horizontal']) {
  flex-direction: column;
  block-size: var(--space-sm);
}

:deep(.trusty-scroll-area-thumb) {
  position: relative;
  flex: 1;
  background-color: var(--color-border);
  border-radius: var(--radius-full);
  transition: background-color var(--duration-fast) ease-out;
}

:deep(.trusty-scroll-area-thumb:hover),
:deep(.trusty-scroll-area-thumb:focus) {
  background-color: var(--color-text-muted);
}

/* Guarantee an accessible touch target regardless of the rendered thumb size. */
:deep(.trusty-scroll-area-thumb::before) {
  --accessible-touch-target: 44px;

  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 100%;
  min-inline-size: var(--accessible-touch-target);
  block-size: 100%;
  min-block-size: var(--accessible-touch-target);
  content: '';
  transform: translate(-50%, -50%);
}

@media (prefers-reduced-motion: reduce) {
  :deep(.trusty-scroll-area-scrollbar),
  :deep(.trusty-scroll-area-thumb) {
    transition: none;
  }
}
</style>
