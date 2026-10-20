<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/number-field
//
// PRIVATE primitive — NOT exported from the library. TrustyNumberField is the public wrapper over it.

import type { NumberFieldBaseProps } from './NumberFieldBase.types'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from 'reka-ui'
import { computed } from 'vue'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'

const props = withDefaults(defineProps<NumberFieldBaseProps>(), {
  disabled: false,
  required: false,
  invalid: false,
  steppers: false,
  inputDisabled: false,
})

// null = empty. Reka uses number | null for NumberField's value.
const model = defineModel<number | null>({ default: null })

const resolvedFormatOptions = computed<Intl.NumberFormatOptions>(() => ({
  maximumFractionDigits: props.precision ?? 20,
  ...props.formatOptions,
}))

const resolvedStep = computed(() => props.step ?? (props.precision !== undefined ? 10 ** -props.precision : 1))
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <NumberFieldRoot
    v-model="model"
    :min="min"
    :max="max"
    :step="resolvedStep"
    :disabled="disabled"
    :required="required"
    :format-options="resolvedFormatOptions"
    class="trusty-number-field"
    :data-invalid="invalid || undefined"
  >
    <NumberFieldDecrement
      v-if="steppers"
      class="trusty-number-field-button"
    >
      <TrustyIcon name="ph:minus" />
    </NumberFieldDecrement>
    <!-- `required` goes on the INPUT, not just the Root: Reka's NumberFieldRoot renders a wrapper <div> and does not forward it, so passing it only there dropped it silently. Layer-1 controls must land it on the focusable element — see TrustyFormItem.conformance.spec.ts. -->
    <NumberFieldInput
      v-bind="$attrs"
      :placeholder="placeholder"
      :required="required || undefined"
      :aria-invalid="invalid || undefined"
      :readonly="inputDisabled || undefined"
      class="trusty-number-field-input"
    />
    <span
      v-if="unit"
      class="trusty-number-field-unit"
      aria-hidden="true"
    >{{ unit }}</span>
    <NumberFieldIncrement
      v-if="steppers"
      class="trusty-number-field-button"
    >
      <TrustyIcon name="ph:plus" />
    </NumberFieldIncrement>
  </NumberFieldRoot>
</template>

<style scoped>
.trusty-number-field {
  display: flex;
  align-items: stretch;
  inline-size: 100%;
  min-block-size: var(--size-control-md);
  background-color: var(--color-secondary);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  transition:
    border-color var(--duration-fast) ease-out,
    box-shadow var(--duration-fast) ease-out;
}

/* Hover only hints while unfocused — focus (below) owns the border once the field has it, so hovering a focused field doesn't drop back to gray. */
.trusty-number-field:hover:not([data-disabled], :focus-within),
.trusty-number-field:focus:not([data-disabled], :focus-within) {
  border-color: var(--color-text-muted);
}

/* The border IS the focus ring (no extra outline). */
.trusty-number-field:focus-within {
  border-color: var(--color-primary-highlight);
}

.trusty-number-field[data-invalid] {
  border-color: var(--color-border-danger);
}

/* Disabled paints muted surfaces (no opacity — the colours carry the state). */
.trusty-number-field[data-disabled] {
  cursor: not-allowed;
  background-color: var(--color-secondary-muted);
  border-color: var(--color-border);
}

.trusty-number-field[data-disabled] .trusty-number-field-input {
  color: var(--color-text-muted);
}

.trusty-number-field-input {
  box-sizing: border-box;
  flex: 1;
  min-inline-size: 0;
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
  text-align: start;
  appearance: none;
  background-color: transparent;
  border: none;
}

/* `inputDisabled` renders the input readonly (not disabled): it stays focusable so arrow keys still step the value; only typing is blocked. A not-allowed cursor signals "not for typing". */
.trusty-number-field:not([data-disabled]) .trusty-number-field-input:read-only {
  cursor: not-allowed;
}

.trusty-number-field-input::placeholder {
  color: var(--color-text-muted);
}

.trusty-number-field-unit {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding-inline-end: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

/* The focus ring lives on the wrapper via :focus-within (it frames input + steppers as one control), so the inner input drops its own outline. */
/* stylelint-disable-next-line a11y/no-outline-none */
.trusty-number-field-input:focus {
  outline: none;
}

/* Styled to match TrustyButton's `secondary` variant (same colour channels and state targets) — it can't BE a TrustyButton because Reka's stepper primitives own the behaviour and `as`/`asChild` is off-limits here. */
.trusty-number-field-button {
  --stepper-fg: var(--color-text);
  --stepper-fg-hover: var(--color-text);
  --stepper-fg-active: var(--color-primary-highlight);
  --stepper-fg-disabled: var(--color-text-muted);
  --stepper-bg: var(--color-secondary);
  --stepper-bg-hover: var(--color-secondary-muted);
  --stepper-bg-active: var(--color-secondary-muted);
  --stepper-bg-disabled: var(--color-secondary-muted);
  --stepper-color-border: var(--color-border);
  --stepper-color-border-hover: var(--color-text-muted);

  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;

  /* Same as the field's height (see the input's border-box sizing) → square. */
  inline-size: var(--size-control-md);
  font-size: var(--font-size-lg);
  color: var(--stepper-fg);
  appearance: none;
  cursor: pointer;
  background-color: var(--stepper-bg);
  border: none;
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out;
}

.trusty-number-field-button:first-child {
  border-inline-end: var(--border-sm) solid var(--stepper-color-border);
}

.trusty-number-field-button:last-child {
  border-inline-start: var(--border-sm) solid var(--stepper-color-border);
}

.trusty-number-field-button:hover:not([data-disabled]),
.trusty-number-field-button:focus:not([data-disabled]) {
  --stepper-fg: var(--stepper-fg-hover);
  --stepper-bg: var(--stepper-bg-hover);
  --stepper-color-border: var(--stepper-color-border-hover);
}

.trusty-number-field-button:active:not([data-disabled]) {
  --stepper-fg: var(--stepper-fg-active);
  --stepper-bg: var(--stepper-bg-active);
}

.trusty-number-field-button:focus-visible {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

/* Disabled paints muted channels, like TrustyButton — matching the muted surface the disabled field itself paints. */
.trusty-number-field-button[data-disabled] {
  --stepper-fg: var(--stepper-fg-disabled);
  --stepper-bg: var(--stepper-bg-disabled);

  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-number-field,
  .trusty-number-field-button {
    transition: none;
  }
}
</style>
