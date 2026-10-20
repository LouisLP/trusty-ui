<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/editable
//
// PRIVATE primitive — NOT exported from the library. Reka's Editable is string-based, so this holds the string model, the edit/preview machinery and all the styling. Public, type-specific wrappers compose on top of it with rules that fit their value type: TrustyEditableText (maxLength), TrustyEditableNumber (min/max/precision).

import type { EditableBaseProps } from './EditableBase.types'
import { EditableArea, EditableEditTrigger, EditableInput, EditablePreview, EditableRoot } from 'reka-ui'
import { ref } from 'vue'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'

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

// Mirror Reka's edit/submit/cancel state locally so the root element (for its hover affordance) and the trigger can both react to it. The slot's `isEditing` is only in scope inside the slot, not on EditableRoot itself.
const isEditing = ref(false)
function onState(state: 'edit' | 'submit' | 'cancel') {
  isEditing.value = state === 'edit'
}

function onSubmit(value: string | null | undefined) {
  emit('submit', value ?? '')
}
</script>

<template>
  <EditableRoot
    v-model="model"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :max-length="maxLength"
    :auto-resize="false"
    :activation-mode="disabled ? 'none' : 'focus'"
    submit-mode="both"
    class="trusty-editable"
    :data-invalid="invalid || undefined"
    :data-editing="isEditing || undefined"
    :data-disabled="disabled || undefined"
    :aria-disabled="disabled || undefined"
    @submit="onSubmit"
    @update:state="onState"
  >
    <EditableArea class="trusty-editable-area">
      <EditablePreview class="trusty-editable-preview" />
      <EditableInput
        class="trusty-editable-input"
        :aria-invalid="invalid || undefined"
      />
    </EditableArea>

    <!-- Confirmation is implicit — Enter or blur commits, Esc cancels — so the pencil is the only affordance. It hides once editing starts, leaving the field as seamless inline text. -->
    <EditableEditTrigger
      v-if="!disabled && !isEditing"
      class="trusty-editable-trigger"
      aria-label="Edit"
    >
      <TrustyIcon name="ph:pencil-simple" />
    </EditableEditTrigger>
  </EditableRoot>
</template>

<style scoped>
/* Inline control: hugs its content (text + pencil) rather than filling the parent — wrap it in a stretched container if you need full width. */
.trusty-editable {
  display: inline-flex;
  gap: var(--space-2xs);
  align-items: center;
  max-inline-size: 100%;
  min-block-size: var(--size-control-md);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text);

  /* Reserve a transparent border so revealing the affordance box on hover only changes its colour — the control never reflows. */
  border: var(--border-sm) solid transparent;
  border-radius: var(--radius-sm);
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.trusty-editable[data-invalid]:not([data-editing], [data-disabled]):hover,
.trusty-editable[data-invalid]:not([data-editing], [data-disabled]):focus-within {
  border-color: var(--color-border-danger);
}

/* Keyboard focus draws the ring around the whole control, not just the pencil. */
.trusty-editable:not([data-editing], [data-disabled]):has(:focus-visible) {
  outline: var(--border-md) solid var(--color-primary-highlight);
}

.trusty-editable[data-invalid]:not([data-editing], [data-disabled]):has(:focus-visible) {
  outline-color: var(--color-danger-text);
}

.trusty-editable[data-disabled] {
  cursor: not-allowed;
  opacity: 0.45;
}

/* The area holds the preview (at rest) and the input (while editing) — Reka shows one at a time. Both hug their content, so the pencil sits right at the end of the text; a floor keeps very short or empty values from collapsing. */
.trusty-editable-area {
  display: inline-flex;
  align-items: center;
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value */
  min-inline-size: 3ch;
  max-inline-size: 100%;
  color: inherit;
}

/* Strip the input's native chrome so it reads as plain inline text aligned with the preview, and let `field-sizing` grow it with its own content. Browsers without `field-sizing` only widen the input while editing — at rest the preview drives the width, so the pencil still hugs the text everywhere. */
.trusty-editable-input {
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value */
  min-inline-size: 3ch;
  max-inline-size: 100%;
  padding: 0;
  font: inherit;
  color: inherit;
  appearance: none;
  outline: none;
  background-color: transparent;
  border: none;
  field-sizing: content;
}

/* Truncate an over-long value to one line with an ellipsis rather than wrapping (Reka supplied this while auto-resize was on; we own it now). `min-inline-size` lets the preview shrink below its text so the ellipsis can kick in. */
.trusty-editable-preview {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
}

.trusty-editable[data-disabled] .trusty-editable-preview {
  cursor: not-allowed;
}

/* Empty value shows the placeholder — dim it. Reka flags emptiness with `data-empty` on the area, not the preview. */
.trusty-editable-area[data-empty] .trusty-editable-preview {
  color: var(--color-text-muted);
}

.trusty-editable-trigger {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--size-control-sm);
  block-size: var(--size-control-sm);
  padding: 0;
  /* stylelint-disable-next-line declaration-property-value-allowed-list */
  font-size: 1.125em;
  color: var(--color-text-muted);
  appearance: none;
  cursor: pointer;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) ease-out;
}

.trusty-editable-trigger:hover,
.trusty-editable-trigger:focus {
  color: var(--color-text);
}

.trusty-editable-trigger:focus-visible {
  outline: var(--border-md) solid var(--color-primary-highlight);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-editable,
  .trusty-editable-trigger {
    transition: none;
  }
}
</style>
