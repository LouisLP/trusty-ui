<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/popover

import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { useId } from 'vue'

type TrustyPopoverSide = 'top' | 'right' | 'bottom' | 'left'
type TrustyPopoverAlignment = 'start' | 'center' | 'end'

withDefaults(defineProps<{
  /** Heading for the panel, rendered as an overline. Also names the dialog for assistive tech. */
  title?: string
  /** Optional supporting line beneath the title. */
  description?: string
  /** Which edge of the trigger the panel is anchored to */
  side?: TrustyPopoverSide
  /** How the panel is aligned relative to the trigger */
  alignment?: TrustyPopoverAlignment
  /** Trap focus and block interaction with the rest of the page while open */
  modal?: boolean
}>(), {
  side: 'bottom',
  alignment: 'center',
  modal: false,
})

/** Open state. Drive with `v-model`, or leave it to the `#trigger` slot. */
const open = defineModel<boolean>({ default: false })

// PopoverContent is role="dialog" and Reka names it from the trigger's text, hardcoding aria-labelledby to the trigger id — it cannot be overridden from here, so the panel is named by what the user clicked rather than by `title`. Reka ships no Description part either, so that link is wired by hand.
const descriptionId = useId()

const SIDE_OFFSET_PX = 6
</script>

<template>
  <PopoverRoot
    v-model:open="open"
    :modal="modal"
  >
    <PopoverTrigger :as-child="true">
      <slot name="trigger" />
    </PopoverTrigger>

    <PopoverPortal>
      <!-- as-child: render our own element as the panel so Vue's scoped data-v attribute lands on it, letting plain scoped selectors style the portalled content. -->
      <PopoverContent
        :align="alignment"
        :side="side"
        :side-offset="SIDE_OFFSET_PX"
        :aria-describedby="description ? descriptionId : undefined"
        :as-child="true"
      >
        <div class="trusty-popover">
          <div
            v-if="title || description"
            class="trusty-popover-header"
          >
            <p
              v-if="title"
              class="trusty-popover-title"
            >
              {{ title }}
            </p>

            <p
              v-if="description"
              :id="descriptionId"
              class="trusty-popover-description"
            >
              {{ description }}
            </p>
          </div>

          <div
            v-if="$slots.default"
            class="trusty-popover-body"
          >
            <slot />
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped>
.trusty-popover {
  --shadow-color: var(--color-shadow);

  z-index: var(--layer-dropdown);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-inline-size: var(--size-2xs);
  max-inline-size: min(var(--size-md), calc(100dvw - var(--space-2xl)));
  padding: var(--space-md);
  font-family: var(--font-family-sans);
  color: var(--color-text);
  background-color: var(--color-bg-lowered);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  box-shadow:
    calc(-1 * var(--space-2xs)) calc(-1 * var(--space-2xs)) var(--shadow-sm) var(--shadow-color),
    var(--space-2xs) var(--space-2xs) var(--shadow-sm) var(--shadow-color);
  transform-origin: var(--reka-popover-content-transform-origin);
  animation: trusty-popover-in var(--duration-fast) ease-out;
}

/* Title and description sit tight together, as one block, per the design. */
.trusty-popover-header {
  display: flex;
  flex-direction: column;
}

.trusty-popover-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
}

.trusty-popover-description {
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
}

.trusty-popover-body {
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

@keyframes trusty-popover-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-popover {
    animation: none;
  }
}
</style>
