<script setup lang="ts">
// Public click-to-edit number. Bridges a `number | null` model onto the string-based private EditableBase and applies numeric rules on commit: unparseable input reverts to the last committed value, parseable input is rounded to `precision` and clamped into [min, max] — mirroring how TrustyNumberField's Reka root clamps on blur.

import { ref, watch } from 'vue'
import EditableBase from '../../private/EditableBase/EditableBase.vue'

const props = withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  /** Lower bound — committed values are clamped up to it. */
  min?: number
  /** Upper bound — committed values are clamped down to it. */
  max?: number
  /** Max fraction digits kept on commit. */
  precision?: number
}>(), {
  disabled: false,
  required: false,
  invalid: false,
})

const emit = defineEmits<{
  /** Fired when the value is committed (Enter / blur). Null = cleared. */
  submit: [value: number | null]
}>()

// null = empty, matching NumberFieldBase's convention.
const model = defineModel<number | null>({ default: null })

function format(value: number | null): string {
  return value === null ? '' : String(value)
}

// String bridge to the text-based base, re-synced whenever the model changes from outside.
const text = ref(format(model.value))
watch(model, value => text.value = format(value))

function constrain(value: number): number {
  let result = value
  if (props.precision !== undefined)
    result = Number(result.toFixed(props.precision))
  if (props.min !== undefined)
    result = Math.max(result, props.min)
  if (props.max !== undefined)
    result = Math.min(result, props.max)
  return result
}

function onSubmit(raw: string) {
  const trimmed = raw.trim()
  if (trimmed !== '' && !Number.isFinite(Number(trimmed))) {
    // Not a number — revert to the last committed value, no emit.
    text.value = format(model.value)
    return
  }
  const next = trimmed === '' ? null : constrain(Number(trimmed))
  text.value = format(next)
  model.value = next
  emit('submit', next)
}
</script>

<template>
  <EditableBase
    v-model="text"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :invalid="invalid"
    @submit="onSubmit"
  />
</template>
