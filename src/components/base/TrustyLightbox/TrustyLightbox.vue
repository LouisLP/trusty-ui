<script setup lang="ts">
// Public-facing overlay for viewing a single image at its natural size, up to the viewport. See DialogBase.vue for the Reka Dialog wiring, centering, and open/close motion — this component owns just the image shadow, the caption, and the floating Close button.

import { DialogClose, DialogTitle } from 'reka-ui'
import DialogBase from '../../private/DialogBase/DialogBase.vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'

defineProps<{
  /** Image name. Rendered as the accessible dialog heading and the caption below the image. */
  title: string
}>()

/** Open state. Drive with `v-model`, or leave it and open via the `#trigger` slot. */
const open = defineModel<boolean>({ default: false })
</script>

<template>
  <DialogBase
    v-model="open"
    :blur="true"
  >
    <template
      v-if="$slots.trigger"
      #trigger
    >
      <slot name="trigger" />
    </template>

    <template #default>
      <!-- Fixed to the viewport corner, independent of the image/box below, so it's always reachable regardless of image size or aspect ratio. -->
      <DialogClose :as-child="true">
        <TrustyButton
          class="trusty-lightbox-close"
          variant="primary"
          icon="ph:x"
          aria-label="Close"
        />
      </DialogClose>

      <div class="trusty-lightbox">
        <div class="trusty-lightbox-image">
          <slot />
        </div>

        <DialogTitle
          class="trusty-lightbox-title"
        >
          {{ title }}
        </DialogTitle>
      </div>
    </template>
  </DialogBase>
</template>

<style scoped>
.trusty-lightbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: center;
  inline-size: fit-content;
  max-inline-size: 85dvw;
  block-size: fit-content;
  max-block-size: 85dvh;
}

.trusty-lightbox-image {
  --shadow-color: var(--color-shadow);

  display: flex;
  min-inline-size: 0;
  min-block-size: 0;
  overflow: hidden;
  border-radius: var(--radius-xs);
  box-shadow: 0 var(--space-sm) var(--space-lg) var(--shadow-color);
}

/* Sized against the viewport (not a percentage of this fit-content box) so any slotted image/video shrinks to fit while keeping its own aspect ratio, instead of overflowing or being cropped as the box narrows. */
.trusty-lightbox-image :deep(img),
.trusty-lightbox-image :deep(video) {
  display: block;
  inline-size: auto;
  max-inline-size: 90dvw;
  block-size: auto;
  max-block-size: 90dvh;
  object-fit: contain;
}

.trusty-lightbox-title {
  flex: 0 0 auto;
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-md);
  font-weight: bold;
  line-height: var(--line-height-snug);
  color: var(--color-text);
  text-align: center;
}

/* Fixed to the viewport corner — independent of the image box's size, so it never gets crowded out or hidden as the box narrows or grows. */
.trusty-lightbox-close {
  position: fixed;
  inset-block-start: var(--space-md);
  inset-inline-end: var(--space-md);
  z-index: var(--layer-modal);
}
</style>
