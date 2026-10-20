<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/separator

import { Separator } from 'reka-ui'

type TrustySeparatorOrientation = 'horizontal' | 'vertical'
type TrustySeparatorSize = 'sm' | 'md'

withDefaults(defineProps<{
  /** Which way the rule runs. Vertical stretches to its flex parent's cross size. */
  orientation?: TrustySeparatorOrientation
  /** Line thickness — `sm` is 1px, `md` is 2px. */
  size?: TrustySeparatorSize
}>(), {
  orientation: 'horizontal',
  size: 'sm',
})
</script>

<template>
  <Separator
    :orientation="orientation"
    :data-size="size"
    class="trusty-separator"
  />
</template>

<style scoped>
.trusty-separator {
  /* Per-instance thickness channel; sm is the resting size, md repaints it. */
  --asep-thickness: var(--border-sm);

  flex: none;
  background-color: var(--color-border);
}

.trusty-separator[data-size='md'] {
  --asep-thickness: var(--border-md);
}

/* Reka reflects data-orientation on the root; the thickness swaps axis with it. */
.trusty-separator[data-orientation='horizontal'] {
  inline-size: 100%;
  block-size: var(--asep-thickness);
}

.trusty-separator[data-orientation='vertical'] {
  align-self: stretch;
  inline-size: var(--asep-thickness);
  block-size: 100%;
}
</style>
