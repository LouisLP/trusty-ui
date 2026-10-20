<script setup lang="ts">
// Native text input, not Reka's ColorField: that can't be empty, keeps the `#`, and reverts invalid text on blur.

import { computed, ref, watch } from 'vue'
import ColorChannelSlider from '../../private/ColorChannelSlider/ColorChannelSlider.vue'
import ColorPicker from '../../private/ColorPicker/ColorPicker.vue'

withDefaults(defineProps<{
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  disabled: false,
  required: false,
  invalid: false,
})

/** `#RRGGBB`, or `#RRGGBBAA` below full opacity; `''` when empty. Text that isn't hex commits as typed, for the consumer's validator to flag. */
const model = defineModel<string>({ default: '' })

const HEX_RE = /^(?:[\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i

function stripHash(value: string) {
  return value.trim().replace(/^#/, '')
}

function toHex(text: string): string | null {
  if (!HEX_RE.test(text))
    return null
  const digits = text.length === 3 ? [...text].map(c => c + c).join('') : text
  return `#${digits.toUpperCase().replace(/^(.{6})FF$/, '$1')}`
}

// Committed on blur / Enter.
const draft = ref(stripHash(model.value))
watch(model, (value) => {
  draft.value = stripHash(value)
})

const color = computed(() => toHex(stripHash(model.value)))

function onInput(event: Event) {
  draft.value = (event.target as HTMLInputElement).value.replace(/^#/, '')
}

function commit() {
  const text = stripHash(draft.value)
  const next = text ? (toHex(text) ?? `#${text}`) : ''
  draft.value = stripHash(next)
  model.value = next
}

function onPick(value: string) {
  model.value = toHex(stripHash(value)) ?? model.value
}
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <div
    class="trusty-color-input"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
  >
    <ColorPicker
      :color="color"
      :disabled="disabled"
      @pick="onPick"
    />
    <span class="trusty-color-input-hex">
      <span
        class="trusty-color-input-hash"
        aria-hidden="true"
      >#</span>
      <!-- eslint-disable-next-line vue-a11y/form-control-has-label -->
      <input
        v-bind="$attrs"
        :value="draft"
        type="text"
        placeholder="000000"
        autocomplete="off"
        spellcheck="false"
        :disabled="disabled || undefined"
        :required="required || undefined"
        :aria-invalid="invalid || undefined"
        class="trusty-color-input-field"
        @input="onInput"
        @blur="commit"
        @keydown.enter="commit"
      >
    </span>
    <ColorChannelSlider
      v-if="color"
      :color="color"
      channel="alpha"
      :disabled="disabled"
      class="trusty-color-input-alpha"
      @pick="onPick"
    />
  </div>
</template>

<style scoped>
.trusty-color-input {
  /* Control height minus border and padding. */
  --color-picker-swatch-size: calc(var(--size-control-md) - 2 * var(--border-md) - 2 * var(--space-xs));

  display: flex;
  gap: var(--space-sm);
  align-items: center;
  inline-size: 100%;
  min-block-size: var(--size-control-md);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  background-color: var(--color-bg-lowered);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  transition: border-color var(--duration-fast) ease-out;
}

/* Hover hints only while unfocused, as TextInputBase. */
.trusty-color-input:hover:not([data-disabled], :focus-within),
.trusty-color-input:focus:not([data-disabled], :focus-within) {
  border-color: var(--color-border-highlight);
}

/* The border is the focus ring, so the slider thumb lights it too. */
.trusty-color-input:focus-within {
  border-color: var(--color-primary-highlight);
}

.trusty-color-input:focus-within :deep(.color-picker-swatch) {
  border-color: var(--color-primary-highlight);
}

.trusty-color-input[data-invalid] {
  border-color: var(--color-border-danger);
}

.trusty-color-input[data-disabled] {
  cursor: not-allowed;
  background-color: var(--color-secondary-muted);
  border-color: var(--color-border);
}

.trusty-color-input-hex {
  display: flex;
  flex: 1;
  align-items: center;
  min-inline-size: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
}

.trusty-color-input-hash {
  flex: none;
  color: var(--color-text-muted);
}

.trusty-color-input-field {
  flex: 1;
  min-inline-size: 0;
  padding: 0;
  font: inherit;
  color: var(--color-text-toned);
  text-transform: uppercase;
  letter-spacing: inherit;
  appearance: none;
  background-color: transparent;
  border: none;
}

.trusty-color-input-field::placeholder {
  color: var(--color-text-muted);
}

.trusty-color-input-field:disabled {
  cursor: not-allowed;
  color: var(--color-text-muted);
}

/* The wrapper carries the ring. */
/* stylelint-disable-next-line a11y/no-outline-none */
.trusty-color-input-field:focus {
  outline: none;
}

.trusty-color-input-alpha {
  flex: 1;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-color-input {
    transition: none;
  }
}
</style>
