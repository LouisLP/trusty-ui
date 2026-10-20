<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/dialog
//
// PRIVATE primitive — NOT exported from the library. Owns only the Reka Dialog wiring (root/trigger/portal/overlay/content), viewport centering, and open/close motion. Deliberately unopinionated about size, background and internal layout, so wildly different shapes can share it without fighting inherited styles: consumers own their own box inside the default slot.

import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger,
} from 'reka-ui'

defineProps<{
  /** Whether to apply a blur effect to the overlay. */
  blur?: boolean
}>()

/** Open state. Drive with `v-model`. */
const open = defineModel<boolean>({ default: false })

/** Handed to the default slot so consumers can dismiss without their own state. */
function close() {
  open.value = false
}
</script>

<template>
  <DialogRoot v-model:open="open">
    <!-- as-child merges the trigger wiring onto the consumer's own control (e.g. a TrustyButton) instead of wrapping it in an extra element. -->
    <DialogTrigger
      v-if="$slots.trigger"
      :as-child="true"
    >
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal>
      <!-- as-child renders OUR elements (which carry Vue's scoped data-v attribute) as the portalled overlay/content, so scoped styles still reach them — no :global needed. -->
      <DialogOverlay :as-child="true">
        <div
          class="dialog-base-overlay"
          :data-blur="blur || undefined"
        />
      </DialogOverlay>

      <DialogContent :as-child="true">
        <!-- fit-content (not auto) is required: inset:0 on a fixed element with width:auto stretches to fill the viewport, which would make this div swallow every click and break Reka's outside-click detection. Consumers override inline-size/block-size as needed. -->
        <div class="dialog-base">
          <slot :close="close" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
.dialog-base-overlay {
  --overlay-color: color-mix(in srgb, var(--color-bg-lowered) 70%, transparent);

  position: fixed;
  inset: 0;
  z-index: var(--layer-modal-overlay);
  background-color: var(--overlay-color);
  animation: dialog-base-overlay-in var(--duration-fast) ease-out;
}

.dialog-base-overlay[data-blur] {
  backdrop-filter: blur(var(--blur-lg));
}

.dialog-base-overlay[data-state='closed'] {
  animation: dialog-base-overlay-out var(--duration-fast) ease-in;
}

.dialog-base {
  position: fixed;

  /* inset:0 + margin:auto centers a fixed, fit-content box on both axes without a transform — leaving transform free for the open/close animation. Consumers can override inline-size/block-size freely; the box stays centered either way. */
  inset: 0;
  z-index: var(--layer-modal);
  inline-size: fit-content;
  block-size: fit-content;
  margin: auto;
  pointer-events: auto;
  animation: dialog-base-in var(--duration-fast) ease-out;
}

.dialog-base[data-state='closed'] {
  animation: dialog-base-out var(--duration-fast) ease-in;
}

@keyframes dialog-base-overlay-in {
  from {
    opacity: 0;
  }
}

@keyframes dialog-base-overlay-out {
  to {
    opacity: 0;
  }
}

@keyframes dialog-base-in {
  from {
    opacity: 0;
    transform: translateY(var(--space-sm)) scale(0.97);
  }
}

@keyframes dialog-base-out {
  to {
    opacity: 0;
    transform: scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dialog-base-overlay,
  .dialog-base {
    animation: none;
  }
}
</style>
