<script setup lang="ts">
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustySpinnerSize = 'xs' | 'sm' | 'md' | 'lg'

withDefaults(defineProps<{
  /** Fixed design-token size, on TrustyIcon's scale. */
  size?: TrustySpinnerSize
}>(), {
  size: 'md',
})
</script>

<template>
  <span
    class="trusty-spinner"
    role="status"
    :data-size="size"
  >
    <TrustyIcon
      name="ph:spinner-gap"
      :size="size"
      class="trusty-spinner-icon"
    />
    <span class="trusty-spinner-sr">Loading…</span>
  </span>
</template>

<style scoped>
/* Read by assistive tech, drawn nowhere. Not Reka's VisuallyHidden: that one sets aria-hidden="true" by default, which hides the text from the very readers it is for. */
.trusty-spinner-sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}
.trusty-spinner {
  display: inline-flex;
  flex: none;
  color: inherit;
}

/* Same timing as TrustyButton's inline spinner, so the two read as one motion. */
.trusty-spinner-icon {
  animation: trusty-spinner-spin var(--duration-deliberate) linear infinite;
}

@keyframes trusty-spinner-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-spinner-icon {
    animation: none;
  }
}
</style>
