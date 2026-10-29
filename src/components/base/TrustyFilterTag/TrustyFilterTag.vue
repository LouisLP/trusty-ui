<script setup lang="ts">
// Public filter chip. Thin skin over the private TagBase: this component owns only the on/off state, which it reports through `v-model` and reflects as `aria-pressed` — the ring is the base's. A chip that adds or removes a tag is TrustyTag, which skins the same base.

import type { TrustyTagColor } from '../TrustyTag/TrustyTag.types'
import TagBase from '../../private/TagBase/TagBase.vue'

withDefaults(defineProps<{
  /** Chip text. Plain string only: keeps every tag on the design system. */
  label: string
  /** Which of the seven hues to paint. Decorative — the app decides what a hue means. */
  color?: TrustyTagColor
  disabled?: boolean
}>(), {
  color: 'mint',
  disabled: false,
})

// Whether this filter is on. `aria-pressed` is always rendered, so assistive tech reads the chip as a toggle whether or not it is currently on.
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <TagBase
    :label="label"
    :color="color"
    :disabled="disabled"
    :pressed="model"
    @click="model = !model"
  />
</template>
