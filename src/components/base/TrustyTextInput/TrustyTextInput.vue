<script setup lang="ts">
// Public single-line text field. Thin pass-through over the private TextInputBase with no leading/trailing slots, keeping this base control lean. For search (icon + clear) use TrustySearchInput; for secrets TrustySecretInput.

import TextInputBase from '../../private/TextInputBase/TextInputBase.vue'

type TrustyTextInputType = 'text' | 'email' | 'url' | 'tel'

withDefaults(defineProps<{
  type?: TrustyTextInputType
  placeholder?: string
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  type: 'text',
  disabled: false,
  required: false,
  invalid: false,
})

const model = defineModel<string>({ default: '' })
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <TextInputBase
    v-bind="$attrs"
    v-model="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :invalid="invalid"
  />
</template>
