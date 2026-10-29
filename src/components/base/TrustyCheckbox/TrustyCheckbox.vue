<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/checkbox

import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed, useAttrs, useId } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustyCheckboxValue = boolean | 'indeterminate'
type TrustyCheckboxSize = 'sm' | 'md'

// A layer-1 control: fall-through attrs must reach the FOCUSABLE element, not the outer <label>. TrustyFormItem's `field.id` is what its own <label :for> points at, so landing it on our label would point a label at a label.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  /** Visible label, rendered beside the box. Omit and pair with `aria-label`. */
  label?: string
  /** Box dimension. */
  size?: TrustyCheckboxSize
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  size: 'md',
  disabled: false,
  required: false,
  invalid: false,
})

// Checked state. `'indeterminate'` is a valid value (mixed children, etc.).
const model = defineModel<TrustyCheckboxValue>({ default: false })

// Associates the visible label with the Reka control. An `id` handed down by TrustyFormItem wins, so our <label :for> and the control agree on one id.
const attrs = useAttrs()
const fallbackId = useId()
const controlId = computed(() => (attrs.id as string | undefined) ?? fallbackId)
</script>

<template>
  <!-- Reka renders the control (a button[role=checkbox]); associated via :for/:id. -->
  <!-- eslint-disable-next-line vue-a11y/label-has-for -->
  <label
    class="trusty-checkbox"
    :for="controlId"
    :data-size="size"
    :data-disabled="disabled || undefined"
    :data-invalid="invalid || undefined"
  >
    <CheckboxRoot
      v-bind="$attrs"
      :id="controlId"
      v-model="model"
      :disabled="disabled"
      :required="required"
      :aria-invalid="invalid || undefined"
      :data-invalid="invalid || undefined"
      class="trusty-checkbox-box"
    >
      <!-- force-mount keeps the indicator in the DOM in every state, so the box never reflows when toggled; it's hidden via CSS while unchecked. -->
      <CheckboxIndicator
        class="trusty-checkbox-indicator"
        :force-mount="true"
      >
        <TrustyIcon :name="model === 'indeterminate' ? 'ph:minus' : 'ph:check'" />
      </CheckboxIndicator>
    </CheckboxRoot>

    <span
      v-if="label"
      class="trusty-checkbox-label"
    >
      {{ label }}
    </span>
  </label>
</template>

<style scoped>
.trusty-checkbox {
  display: inline-flex;
  gap: var(--space-sm);
  align-items: center;
  font-family: var(--font-family-sans);
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
}

.trusty-checkbox[data-size='sm'] {
  --trusty-checkbox-size: 1.125rem;

  font-size: var(--font-size-xs);
}

.trusty-checkbox[data-size='md'] {
  --trusty-checkbox-size: 1.5rem;

  font-size: var(--font-size-sm);
}

.trusty-checkbox[data-disabled] {
  cursor: not-allowed;
}

/* Per-state colour channels */
.trusty-checkbox-box {
  /* unchecked = default channel set */
  --trusty-checkbox-bg: var(--color-bg-inset);
  --trusty-checkbox-bg-hover: var(--color-bg-inset);
  --trusty-checkbox-border: var(--color-border);
  --trusty-checkbox-border-hover: var(--color-text-muted);
  --trusty-checkbox-fg: var(--color-text);

  box-sizing: border-box;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--trusty-checkbox-size);
  block-size: var(--trusty-checkbox-size);
  padding: 0;
  color: var(--trusty-checkbox-fg);
  appearance: none;
  cursor: inherit;
  background-color: var(--trusty-checkbox-bg);
  border: var(--border-md) solid var(--trusty-checkbox-border);
  border-radius: var(--radius-xs);
  transition:
    background-color var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

/* Checked — primary fill, brightening on hover. */
.trusty-checkbox-box[data-state='checked'] {
  --trusty-checkbox-bg: var(--color-primary);
  --trusty-checkbox-bg-hover: var(--color-primary-hover);
  --trusty-checkbox-border: var(--color-primary);
  --trusty-checkbox-border-hover: var(--color-primary-hover);
  --trusty-checkbox-fg: var(--color-on-primary);
}

/* Indeterminate — shares the neutral box, with a white dash. */
.trusty-checkbox-box[data-state='indeterminate'] {
  --trusty-checkbox-fg: var(--color-text);
}

.trusty-checkbox-box:hover:not(:disabled) {
  background-color: var(--trusty-checkbox-bg-hover);
  border-color: var(--trusty-checkbox-border-hover);
}

/* Keyboard focus ring: authored on :focus (so the a11y linter sees it paired with :hover), then hidden for pointer focus — only keyboard users see it. */
.trusty-checkbox-box:focus:not(:disabled) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-checkbox-box:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled — explicit muted fills per state (no opacity hack). */
.trusty-checkbox-box:disabled[data-state='unchecked'],
.trusty-checkbox-box:disabled[data-state='indeterminate'] {
  color: var(--color-text-muted);
  background-color: var(--color-bg-inset-muted);
  border-color: var(--color-border);
}

.trusty-checkbox-box:disabled[data-state='checked'] {
  color: var(--color-text-muted);
  background-color: var(--color-primary-disabled);
  border-color: var(--color-primary-disabled);
}

.trusty-checkbox[data-disabled] .trusty-checkbox-label {
  color: var(--color-text-muted);
}

/* Always mounted (force-mount); only revealed once checked/indeterminate so the box keeps a constant footprint and never jumps on toggle. */
.trusty-checkbox-indicator {
  display: inline-flex;
  visibility: hidden;
  align-items: center;
  justify-content: center;
  inline-size: 100%;
  block-size: 100%;
}

.trusty-checkbox-indicator[data-state='checked'],
.trusty-checkbox-indicator[data-state='indeterminate'] {
  visibility: visible;
}

.trusty-checkbox-indicator :deep(.trusty-icon) {
  inline-size: 100%;
  block-size: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-checkbox-box {
    transition: none;
  }
}
</style>
