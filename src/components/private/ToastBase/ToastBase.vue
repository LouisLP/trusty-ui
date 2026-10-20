<script setup lang="ts">
// PRIVATE primitive — NOT exported from the library. Owns the whole toast host: one Reka ToastProvider, the fixed bottom-centre viewport, and one AlertBase-skinned toast per item. TrustyToast feeds it a single item from its own props; TrustyToaster feeds it the useTrustyToast queue.
// REFERENCE: https://reka-ui.com/docs/components/toast

import type { ToastBaseItem } from './ToastBase.types'
import { ToastClose, ToastProvider, ToastRoot, ToastViewport } from 'reka-ui'
import TrustyButton from '../../base/TrustyButton/TrustyButton.vue'
import AlertBase from '../AlertBase/AlertBase.vue'

defineProps<{ toasts: readonly ToastBaseItem[] }>()

const emit = defineEmits<{
  /** The toast asked to go: the close button, a swipe, Escape, or the timer ran out. */
  close: [id: string]
}>()

// Every toast keeps the same cadence, so the duration is not the caller's to tune. Reka pauses the timer while the viewport is hovered or focused.
const DURATION_MS = 5000
</script>

<template>
  <ToastProvider swipe-direction="down">
    <!-- as-child throughout: the toast wiring merges onto our own native elements, so Vue's scoped data-v reaches every styled node — no :global() needed even though Reka teleports the toast into the viewport. -->
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :open="toast.open"
      :duration="DURATION_MS"
      :as-child="true"
      @update:open="(value: boolean) => !value && emit('close', toast.id)"
    >
      <li class="toast-base">
        <AlertBase
          :title="toast.title"
          :description="toast.description"
          :variant="toast.variant"
          :live="false"
        >
          <!-- ToastClose merges its dismiss wiring onto our own TrustyButton, so the close affordance stays a real TrustyButton. -->
          <template #end>
            <ToastClose :as-child="true">
              <TrustyButton
                variant="ghost"
                size="sm"
                icon="ph:x"
                aria-label="Dismiss"
                class="toast-base-dismiss"
              />
            </ToastClose>
          </template>
        </AlertBase>
      </li>
    </ToastRoot>

    <ToastViewport :as-child="true">
      <ol class="toast-base-viewport" />
    </ToastViewport>
  </ToastProvider>
</template>

<style scoped>
/* Fixed stack, bottom centre. position: fixed takes it out of flow regardless of where the host mounts. */
.toast-base-viewport {
  position: fixed;
  inset-block-end: var(--space-lg);
  inset-inline-start: 50%;
  z-index: var(--layer-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  inline-size: var(--size-sm);
  max-inline-size: calc(100vw - 2 * var(--space-lg));
  padding: 0;
  margin: 0;
  list-style: none;
  transform: translateX(-50%);
}

.toast-base {
  --shadow-color: var(--color-shadow);

  /* grid so the AlertBase inside stretches to the viewport's width. */
  display: grid;
  border-radius: var(--radius-sm);
  box-shadow:
    calc(-1 * var(--space-2xs)) calc(-1 * var(--space-2xs)) var(--shadow-sm) var(--shadow-color),
    var(--space-2xs) var(--space-2xs) var(--shadow-sm) var(--shadow-color);
  animation: toast-base-in var(--duration-normal) ease-out;
}

.toast-base-dismiss {
  /* TrustyIcon tracks font-size, and the design puts an 18px close glyph in the 24px control — the sm size's block padding has to go for it to fit without growing the button. */
  padding-block: 0;
  font-size: var(--font-size-lg);
}

/* Swipe-to-dismiss follows the pointer downwards, then animates out on release. */
.toast-base[data-swipe='move'] {
  transform: translateY(var(--reka-toast-swipe-move-y));
}

.toast-base[data-swipe='cancel'] {
  transform: translateY(0);
  transition: transform var(--duration-fast) ease-out;
}

.toast-base[data-state='closed'],
.toast-base[data-swipe='end'] {
  animation: toast-base-out var(--duration-fast) ease-in forwards;
}

@keyframes toast-base-in {
  from {
    opacity: 0;
    transform: translateY(var(--space-md));
  }
}

@keyframes toast-base-out {
  to {
    opacity: 0;
    transform: translateY(var(--space-md));
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-base,
  .toast-base[data-state='closed'],
  .toast-base[data-swipe='end'] {
    animation: none;
  }
}
</style>
