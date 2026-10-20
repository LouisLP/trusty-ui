<script setup lang="ts">
// Clickable image preview (thumbnail) that opens the image at full resolution in a TrustyLightbox. Wraps exactly one public component — TrustyLightbox — fixing its trigger to a framed preview image.

import { computed } from 'vue'
import TrustyLightbox from '../../base/TrustyLightbox/TrustyLightbox.vue'

const props = withDefaults(defineProps<{
  /** Preview image shown inline. */
  src: string
  /** Higher-resolution source shown in the lightbox. Falls back to `src` when omitted. */
  lightboxSrc?: string
  alt?: string
}>(), {
  lightboxSrc: undefined,
  alt: '',
})

const resolvedLightboxSrc = computed(() => props.lightboxSrc ?? props.src)
</script>

<template>
  <div class="trusty-thumbnail">
    <TrustyLightbox :title="alt || 'Image preview'">
      <template #trigger>
        <button
          type="button"
          class="trusty-thumbnail-trigger"
          :aria-label="alt ? `View ${alt} enlarged` : 'View image enlarged'"
        >
          <img
            class="trusty-thumbnail-preview"
            :src="src"
            :alt="alt"
          >
        </button>
      </template>

      <img
        :src="resolvedLightboxSrc"
        :alt="alt"
      >
    </TrustyLightbox>
  </div>
</template>

<style scoped>
.trusty-thumbnail {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-inline-size: 0;
  min-block-size: 0;
}

.trusty-thumbnail-trigger {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-inline-size: 0;
  min-block-size: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
  background: var(--color-bg-lowered);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color var(--duration-fast) ease-in-out;
}

.trusty-thumbnail-trigger:focus-visible {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-thumbnail-trigger:hover,
.trusty-thumbnail-trigger:focus {
  border-color: var(--color-primary-highlight);
}

.trusty-thumbnail-preview {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  object-fit: contain;
}
</style>
