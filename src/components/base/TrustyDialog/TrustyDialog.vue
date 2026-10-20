<script setup lang="ts">
// Public, design-constrained wrapper around the private DialogBase shell: fixed title/close header, optional description, and a slotted body/footer. This component owns the visible box and internal layout, which are specific to this dialog's shape; DialogBase owns the Reka wiring, centering and motion.

import { DialogClose, DialogDescription, DialogTitle } from 'reka-ui'
import DialogBase from '../../private/DialogBase/DialogBase.vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'

defineProps<{
  /** Accessible heading. Required — announced to assistive tech when the dialog opens. */
  title: string
  /** Optional supporting line shown (and announced) beneath the title. */
  description?: string
}>()

/** Open state. Drive with `v-model`, or leave it and open via the `#trigger` slot. */
const open = defineModel<boolean>({ default: false })
</script>

<template>
  <DialogBase v-model="open">
    <template
      v-if="$slots.trigger"
      #trigger
    >
      <slot name="trigger" />
    </template>

    <template #default="{ close }">
      <div class="trusty-dialog">
        <div class="trusty-dialog-content-group">
          <header class="trusty-dialog-header">
            <DialogTitle class="trusty-dialog-title">
              {{ title }}
            </DialogTitle>

            <DialogClose :as-child="true">
              <TrustyButton
                variant="ghost"
                size="sm"
                icon="ph:x"
                aria-label="Close dialog"
              />
            </DialogClose>
          </header>

          <DialogDescription
            v-if="description"
            class="trusty-dialog-description"
          >
            {{ description }}
          </DialogDescription>
        </div>

        <div class="trusty-dialog-body">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="trusty-dialog-footer"
        >
          <slot
            name="footer"
            :close="close"
          />
        </footer>
      </div>
    </template>
  </DialogBase>
</template>

<style scoped>
.trusty-dialog {
  --shadow-color: var(--color-shadow);

  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  inline-size: min(var(--size-md), calc(100dvw - var(--space-2xl)));
  max-block-size: 85dvh;
  padding: var(--space-lg);
  font-family: var(--font-family-sans);
  color: var(--color-text);
  background-color: var(--color-bg);
  border: var(--border-sm) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 var(--space-sm) var(--space-md) var(--shadow-color);
}

.trusty-dialog-content-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.trusty-dialog-header {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
  justify-content: space-between;
}

.trusty-dialog-title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-snug);
}

.trusty-dialog-description {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
}

.trusty-dialog-body {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.trusty-dialog-footer {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}
</style>
