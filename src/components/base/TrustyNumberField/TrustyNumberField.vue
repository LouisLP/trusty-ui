<script setup lang="ts">
// Public, plain number field. A thin pass-through over the private NumberFieldBase with no prefix slot. There's no way to add leading content, keeping it simple by design.

import type { NumberFieldBaseProps } from '../../private/NumberFieldBase/NumberFieldBase.types'
import NumberFieldBase from '../../private/NumberFieldBase/NumberFieldBase.vue'

defineProps<NumberFieldBaseProps>()

const model = defineModel<number | null>({ default: null })
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <NumberFieldBase
    v-bind="{ ...$props, ...$attrs }"
    v-model="model"
  />
</template>
