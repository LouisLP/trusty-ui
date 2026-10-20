<script setup lang="ts">
// Public click-to-edit text. Thin pass-through over the private EditableBase with text-appropriate rules (maxLength). For numeric values with min/max bounds use TrustyEditableNumber.

import type { EditableBaseProps } from '../../private/EditableBase/EditableBase.types'
import EditableBase from '../../private/EditableBase/EditableBase.vue'

withDefaults(defineProps<EditableBaseProps>(), {
  disabled: false,
  required: false,
  invalid: false,
})

const emit = defineEmits<{
  /** Fired when the value is committed (Enter / blur). */
  submit: [value: string]
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <EditableBase
    v-model="model"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :invalid="invalid"
    :max-length="maxLength"
    @submit="value => emit('submit', value)"
  />
</template>
