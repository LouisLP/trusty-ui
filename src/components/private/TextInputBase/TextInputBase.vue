<script setup lang="ts">
// PRIVATE primitive — NOT exported from the library. Owns the single-line text-input shell: the bordered wrapper with its hover / focus-within / invalid / disabled states, the inner <input>, and `#prefix` / `#suffix` slots so a wrapper can add icons or buttons without re-implementing it. TrustyTextInput and TrustySearchInput compose on top.

import type { TextInputBaseProps } from './TextInputBase.types'

withDefaults(defineProps<TextInputBaseProps & {
  /** Render the value in the mono family. For tokens and secrets, which are read character by character rather than as prose — the placeholder stays sans. Lives here rather than in the wrapper because the wrapper's scoped styles cannot reach this component's <input>. TrustySecretInput sets it. */
  mono?: boolean
}>(), {
  type: 'text',
  disabled: false,
  required: false,
  invalid: false,
  mono: false,
})

const model = defineModel<string>({ default: '' })
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <div
    class="text-input-base"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
  >
    <span
      v-if="$slots.prefix"
      class="text-input-base-prefix"
    >
      <slot name="prefix" />
    </span>
    <!-- eslint-disable-next-line vue-a11y/form-control-has-label -->
    <input
      v-bind="$attrs"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled || undefined"
      :required="required || undefined"
      :aria-invalid="invalid || undefined"
      :data-mono="mono || undefined"
      class="text-input-base-field"
    >
    <span
      v-if="$slots.suffix"
      class="text-input-base-suffix"
    >
      <slot name="suffix" />
    </span>
  </div>
</template>

<style scoped>
.text-input-base {
  display: flex;
  align-items: center;
  inline-size: 100%;
  min-block-size: var(--size-control-md);
  background-color: var(--color-bg-inset);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  transition:
    border-color var(--duration-fast) ease-out,
    box-shadow var(--duration-fast) ease-out;
}

/* Hover only hints while unfocused — focus (below) owns the border once the field has it, so hovering a focused field doesn't drop back to gray. */
.text-input-base:hover:not([data-disabled], :focus-within),
.text-input-base:focus:not([data-disabled], :focus-within) {
  border-color: var(--color-text-muted);
}

/* The border IS the focus ring (no extra outline), lifted to the wrapper so the whole control (prefix + input + suffix) is framed as one. */
.text-input-base:focus-within {
  border-color: var(--color-primary-highlight);
}

.text-input-base[data-invalid] {
  border-color: var(--color-border-danger);
}

/* Disabled paints muted surfaces (no opacity — the colours carry the state). */
.text-input-base[data-disabled] {
  cursor: not-allowed;
  background-color: var(--color-bg-inset-muted);
  border-color: var(--color-border);
}

.text-input-base[data-disabled] .text-input-base-field {
  color: var(--color-text-muted);
}

.text-input-base-field {
  /* Pin box-sizing: the UA stylesheet makes type=search border-box but type=text content-box, so the search and plain fields would disagree on how padding counts into their height. Matches NumberFieldBase. */
  box-sizing: border-box;
  flex: 1;
  min-inline-size: 0;
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
  appearance: none;
  background-color: transparent;
  border: none;
}

/* The value is mono, the placeholder is prose — so it stays sans. */
.text-input-base-field[data-mono] {
  font-family: var(--font-family-mono);
  font-variant-ligatures: none;
}

.text-input-base-field::placeholder {
  font-family: var(--font-family-sans);
  color: var(--color-text-muted);
}

.text-input-base-field:disabled {
  cursor: not-allowed;
}

/* We render our own clear affordance (see TrustySearchInput), so suppress the WebKit-native search cancel button. */
.text-input-base-field::-webkit-search-cancel-button {
  appearance: none;
}

/* The focus ring lives on the wrapper via :focus-within (it frames the whole control), so the inner input drops its own outline. */
/* stylelint-disable-next-line a11y/no-outline-none */
.text-input-base-field:focus {
  outline: none;
}

/* Layout only — the consumer owns the colour/size of whatever it slots in. */
.text-input-base-prefix {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding-inline-start: var(--space-sm);
}

.text-input-base-suffix {
  display: inline-flex;
  flex: none;
  align-items: center;
  padding-inline-end: var(--space-2xs);
}

@media (prefers-reduced-motion: reduce) {
  .text-input-base {
    transition: none;
  }
}
</style>
