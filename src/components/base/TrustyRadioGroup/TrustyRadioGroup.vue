<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/radio-group

import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { useId } from 'vue'

type TrustyRadioGroupSize = 'sm' | 'md'

withDefaults(defineProps<{
  /** The selectable options. Each renders one radio + label. */
  options: { value: string, label: string, disabled?: boolean }[]
  /** Radio dimension. */
  size?: TrustyRadioGroupSize
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
  orientation?: 'vertical' | 'horizontal'
  /** Submitted name when used inside a native form. */
  name?: string
}>(), {
  size: 'md',
  disabled: false,
  required: false,
  invalid: false,
  orientation: 'vertical',
})

const model = defineModel<string>()

// Stable id prefix so each option's box + label pair up across re-renders.
const uid = useId()
const optionId = (value: string) => `${uid}-${value}`
</script>

<template>
  <RadioGroupRoot
    v-model="model"
    :disabled="disabled"
    :required="required"
    :orientation="orientation"
    :name="name"
    class="trusty-radio-group"
    :aria-invalid="invalid || undefined"
    :data-invalid="invalid || undefined"
    :data-orientation="orientation"
    :data-size="size"
  >
    <div
      v-for="option in options"
      :key="option.value"
      class="trusty-radio-group-option"
    >
      <RadioGroupItem
        :id="optionId(option.value)"
        :value="option.value"
        :disabled="option.disabled"
        class="trusty-radio-group-box"
      >
        <RadioGroupIndicator class="trusty-radio-group-indicator" />
      </RadioGroupItem>
      <!-- :for is bound to the matching RadioGroupItem id above; the rule can't resolve the dynamic association. -->
      <!-- eslint-disable-next-line vue-a11y/label-has-for -->
      <label
        :for="optionId(option.value)"
        class="trusty-radio-group-label"
      >
        {{ option.label }}
      </label>
    </div>
  </RadioGroupRoot>
</template>

<style scoped>
.trusty-radio-group {
  display: flex;
  gap: var(--space-sm);
}

.trusty-radio-group[data-orientation='vertical'] {
  flex-direction: column;
}

.trusty-radio-group[data-orientation='horizontal'] {
  flex-flow: row wrap;
  gap: var(--space-md);
}

.trusty-radio-group[data-size='sm'] {
  --trusty-radio-group-size: 1.125rem;
  --trusty-radio-group-dot-size: 0.625rem;

  font-size: var(--font-size-xs);
}

.trusty-radio-group[data-size='md'] {
  --trusty-radio-group-size: 1.5rem;
  --trusty-radio-group-dot-size: 0.875rem;

  font-size: var(--font-size-sm);
}

.trusty-radio-group-option {
  display: inline-flex;
  gap: var(--space-sm);
  align-items: center;
}

/* Per-state colour channels */
.trusty-radio-group-box {
  /* unselected = default channel set */
  --trusty-radio-group-bg: var(--color-bg-inset);
  --trusty-radio-group-border: var(--color-border);
  --trusty-radio-group-border-hover: var(--color-text-muted);

  box-sizing: border-box;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--trusty-radio-group-size);
  block-size: var(--trusty-radio-group-size);
  padding: 0;
  appearance: none;
  cursor: pointer;
  background-color: var(--trusty-radio-group-bg);
  border: var(--border-md) solid var(--trusty-radio-group-border);
  border-radius: var(--radius-full);
  transition:
    border-color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out;
}

/* Selected — primary border and dot. */
.trusty-radio-group-box[data-state='checked'] {
  --trusty-radio-group-border: var(--color-primary);
  --trusty-radio-group-border-hover: var(--color-primary);
  --trusty-radio-group-dot: var(--color-primary);
}

.trusty-radio-group-box:hover:not([data-disabled]) {
  border-color: var(--trusty-radio-group-border-hover);
}

/* Keyboard focus ring: authored on :focus (so the a11y linter sees it paired with :hover), then hidden for pointer focus — only keyboard users see it. */
.trusty-radio-group-box:focus:not([data-disabled]) {
  outline: var(--border-md) solid var(--color-primary);
  outline-offset: var(--space-2xs);
}

.trusty-radio-group-box:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled — explicit muted colours per state (no opacity hack). */
.trusty-radio-group-box[data-disabled] {
  cursor: not-allowed;

  --trusty-radio-group-bg: var(--color-bg-inset-muted);
  --trusty-radio-group-border: var(--color-border);
  --trusty-radio-group-dot: var(--color-text-muted);
}

.trusty-radio-group-box[data-state='checked'][data-disabled] {
  --trusty-radio-group-border: var(--color-primary-disabled);
  --trusty-radio-group-dot: var(--color-primary-disabled);
}

.trusty-radio-group-indicator {
  display: inline-flex;
  inline-size: var(--trusty-radio-group-dot-size);
  block-size: var(--trusty-radio-group-dot-size);
  background-color: var(--trusty-radio-group-dot);
  border-radius: var(--radius-full);
}

.trusty-radio-group-label {
  font-family: var(--font-family-sans);
  font-size: inherit;
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
}

.trusty-radio-group-box[data-disabled] + .trusty-radio-group-label {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-radio-group-box {
    transition: none;
  }
}
</style>
