<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/splitter#anatomy

import { SplitterPanel } from 'reka-ui'

defineProps<{
  /** Starting size as a percentage of the group (0–100). */
  defaultSize?: number
  /** Smallest size, in percent, the panel can shrink to while dragging. */
  minSize?: number
}>()
</script>

<template>
  <SplitterPanel
    class="trusty-splitter-panel"
    :default-size="defaultSize"
    :min-size="minSize"
  >
    <slot />
  </SplitterPanel>
</template>

<style scoped>
/* Clip overflowing content; the panel owns no padding so it composes anywhere. */
.trusty-splitter-panel {
  overflow: hidden;
}
</style>
