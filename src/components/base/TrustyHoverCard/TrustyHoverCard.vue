<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/hover-card

import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'
import { computed } from 'vue'

type TrustyHoverCardSide = 'top' | 'right' | 'bottom' | 'left'
type TrustyHoverCardAlignment = 'start' | 'center' | 'end'

const props = withDefaults(defineProps<{
  /** Heading for the card. Required — a card with no title is a tooltip. */
  title: string
  /** Optional supporting line beneath the title. */
  description?: string
  /** Which edge of the trigger the card is anchored to */
  side?: TrustyHoverCardSide
  /** How the card is aligned relative to the trigger */
  alignment?: TrustyHoverCardAlignment
  /** Controlled open. Omit to open on hover after the delay. Charts bind this so the card can follow a canvas point. */
  open?: boolean
}>(), {
  side: 'top',
  alignment: 'center',
  open: undefined,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// Long enough that the card does not fire on a pointer merely passing over the trigger, and slow enough to close that the pointer can travel into the card. A controlled `open` skips both.
const OPEN_DELAY_MS = 700
const CLOSE_DELAY_MS = 300
const SIDE_OFFSET_PX = 6

const rootBind = computed(() =>
  props.open === undefined
    ? { openDelay: OPEN_DELAY_MS, closeDelay: CLOSE_DELAY_MS }
    : { open: props.open, openDelay: 0, closeDelay: 0 },
)
</script>

<template>
  <HoverCardRoot
    v-bind="rootBind"
    @update:open="emit('update:open', $event)"
  >
    <HoverCardTrigger :as-child="true">
      <slot name="trigger" />
    </HoverCardTrigger>

    <HoverCardPortal>
      <!-- as-child: render our own element as the card so Vue's scoped data-v attribute lands on it, letting plain scoped selectors style the portalled content. -->
      <HoverCardContent
        :align="alignment"
        :side="side"
        :side-offset="SIDE_OFFSET_PX"
        :as-child="true"
      >
        <div class="trusty-hover-card">
          <div class="trusty-hover-card-header">
            <p class="trusty-hover-card-title">
              {{ title }}
            </p>

            <p
              v-if="description"
              class="trusty-hover-card-description"
            >
              {{ description }}
            </p>
          </div>

          <div
            v-if="$slots.default"
            class="trusty-hover-card-body"
          >
            <slot />
          </div>
        </div>
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>

<style scoped>
.trusty-hover-card {
  --shadow-color: var(--color-shadow);

  z-index: var(--layer-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  /* The 48px floor and 400px cap have no token; the size scale has no step at either, so this is the exact floor and the nearest cap. */
  min-inline-size: var(--space-3xl);
  max-inline-size: min(var(--size-md), calc(100dvw - var(--space-2xl)));
  padding: var(--space-md);
  overflow: clip;
  font-family: var(--font-family-sans);
  color: var(--color-text);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-xs);
  box-shadow:
    calc(-1 * var(--space-2xs)) calc(-1 * var(--space-2xs)) var(--shadow-sm) var(--shadow-color),
    var(--space-2xs) var(--space-2xs) var(--shadow-sm) var(--shadow-color);
  transform-origin: var(--reka-hover-card-content-transform-origin);
  animation: trusty-hover-card-in var(--duration-fast) ease-out;
}

/* Title and description sit tight together, as one block, per the design. */
.trusty-hover-card-header {
  display: flex;
  flex-direction: column;
}

.trusty-hover-card-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
}

.trusty-hover-card-description {
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
}

.trusty-hover-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

@keyframes trusty-hover-card-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-hover-card {
    animation: none;
  }
}
</style>
