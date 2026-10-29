<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/alert-dialog

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from 'reka-ui'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

defineProps<{
  /** Accessible heading. Required — announced to assistive tech when the dialog opens. */
  title: string
  /** Supporting line explaining the consequence of confirming. Strongly recommended. */
  description?: string
}>()

const emit = defineEmits<{
  /** The user confirmed. The dialog closes itself; run the action here. */
  confirm: []
  /** The user dismissed without confirming. */
  cancel: []
}>()

/** Open state. Drive with `v-model`, or leave it and open via the `#trigger` slot. */
const open = defineModel<boolean>({ default: false })
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <!-- as-child merges the trigger wiring onto the consumer's own control (e.g. a TrustyButton) instead of wrapping it in an extra element. -->
    <AlertDialogTrigger
      v-if="$slots.trigger"
      :as-child="true"
    >
      <slot name="trigger" />
    </AlertDialogTrigger>

    <AlertDialogPortal>
      <!-- as-child renders OUR elements (which carry Vue's scoped data-v attribute) as the portalled overlay/content, so scoped styles still reach them — no :global needed. -->
      <AlertDialogOverlay :as-child="true">
        <div class="trusty-alert-dialog-overlay" />
      </AlertDialogOverlay>

      <AlertDialogContent :as-child="true">
        <div class="trusty-alert-dialog">
          <div class="trusty-alert-dialog-content-group">
            <AlertDialogTitle class="trusty-alert-dialog-title">
              {{ title }}
            </AlertDialogTitle>

            <div
              v-if="description"
              class="trusty-alert-dialog-message"
            >
              <TrustyIcon
                class="trusty-alert-dialog-icon"
                name="ph:warning"
                size="md"
              />

              <AlertDialogDescription class="trusty-alert-dialog-description">
                {{ description }}
              </AlertDialogDescription>
            </div>
          </div>

          <footer class="trusty-alert-dialog-footer">
            <AlertDialogCancel :as-child="true">
              <TrustyButton
                variant="ghost"
                size="sm"
                label="Cancel"
                @click="emit('cancel')"
              />
            </AlertDialogCancel>

            <AlertDialogAction :as-child="true">
              <TrustyButton
                variant="danger"
                size="sm"
                label="Delete"
                @click="emit('confirm')"
              />
            </AlertDialogAction>
          </footer>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>

<style scoped>
.trusty-alert-dialog-overlay {
  --overlay-color: color-mix(in oklab, var(--color-bg-lowered) 70%, transparent);

  position: fixed;
  inset: 0;
  z-index: var(--layer-modal-overlay);
  background-color: var(--overlay-color);
  animation: trusty-alert-dialog-overlay-in var(--duration-fast) ease-out;
}

.trusty-alert-dialog-overlay[data-state='closed'] {
  animation: trusty-alert-dialog-overlay-out var(--duration-fast) ease-in;
}

.trusty-alert-dialog {
  --shadow-color: var(--color-shadow);

  position: fixed;
  inset: 0;
  z-index: var(--layer-modal);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  inline-size: min(var(--size-sm), calc(100dvw - var(--space-2xl)));
  block-size: fit-content;
  max-block-size: 85dvh;
  padding: var(--space-lg);
  margin: auto;
  font-family: var(--font-family-sans);
  color: var(--color-text);
  pointer-events: auto;
  background-color: var(--color-bg);
  border: var(--border-sm) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 var(--space-sm) var(--space-sm) var(--shadow-color);
  animation: trusty-alert-dialog-in var(--duration-fast) ease-out;
}

.trusty-alert-dialog[data-state='closed'] {
  animation: trusty-alert-dialog-out var(--duration-fast) ease-in;
}

.trusty-alert-dialog-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.trusty-alert-dialog-title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-snug);
}

.trusty-alert-dialog-message {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.trusty-alert-dialog-icon {
  color: var(--color-warning-text);
}

.trusty-alert-dialog-description {
  padding-block-start: var(--space-xs);
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
}

.trusty-alert-dialog-footer {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

@keyframes trusty-alert-dialog-overlay-in {
  from {
    opacity: 0;
  }
}

@keyframes trusty-alert-dialog-overlay-out {
  to {
    opacity: 0;
  }
}

@keyframes trusty-alert-dialog-in {
  from {
    opacity: 0;
    transform: translateY(var(--space-sm)) scale(0.97);
  }
}

@keyframes trusty-alert-dialog-out {
  to {
    opacity: 0;
    transform: scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-alert-dialog-overlay,
  .trusty-alert-dialog {
    animation: none;
  }
}
</style>
