<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/switch

import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { computed, useAttrs, useId } from 'vue'

// A layer-1 control: fall-through attrs must reach the FOCUSABLE element, not the outer <label>. TrustyFormItem's `field.id` is what its own <label :for> points at, so landing it on our label would point a label at a label.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  /** Visible label, rendered beside the switch. Omit and pair with `aria-label`. */
  label?: string
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

// On/off state.
const model = defineModel<boolean>({ default: false })

// Associates the visible label with the Reka control. An `id` handed down by TrustyFormItem wins, so our <label :for> and the control agree on one id.
const attrs = useAttrs()
const fallbackId = useId()
const controlId = computed(() => (attrs.id as string | undefined) ?? fallbackId)
</script>

<template>
  <!-- Reka renders the control (a button[role=switch]); associated via :for/:id. -->
  <!-- eslint-disable-next-line vue-a11y/label-has-for -->
  <label
    class="trusty-switch"
    :for="controlId"
    :data-disabled="disabled || undefined"
    :data-invalid="invalid || undefined"
  >
    <SwitchRoot
      v-bind="$attrs"
      :id="controlId"
      v-model="model"
      :disabled="disabled"
      :required="required"
      :aria-invalid="invalid || undefined"
      :data-invalid="invalid || undefined"
      class="trusty-switch-track"
    >
      <SwitchThumb class="trusty-switch-thumb" />
    </SwitchRoot>

    <span
      v-if="label"
      class="trusty-switch-label"
    >
      {{ label }}
    </span>
  </label>
</template>

<style scoped>
.trusty-switch {
  display: inline-flex;
  gap: var(--space-sm);
  align-items: center;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
}

.trusty-switch[data-disabled] {
  cursor: not-allowed;
  opacity: 0.45;
}

.trusty-switch-track {
  display: inline-flex;
  flex: none;
  align-items: center;
  inline-size: var(--space-2xl);
  block-size: var(--space-lg);
  padding: var(--space-xs);
  appearance: none;
  cursor: inherit;
  background-color: var(--color-bg-accented);
  border: none;
  border-radius: var(--radius-full);
  transition: background-color var(--duration-fast) ease-out;
}

.trusty-switch-track[data-state='checked'] {
  /* primary, not primary-highlight: the thumb then paints on-primary, which the combo promises AA on its accent. White on primary-highlight fails 3:1 for 154 of 348 combos. */
  background-color: var(--color-primary);
}

.trusty-switch-track:focus-visible {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-switch-thumb {
  display: block;
  inline-size: var(--space-md);
  block-size: var(--space-md);
  background-color: var(--color-control-thumb);
  border-radius: var(--radius-full);
  transition:
    transform var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out;
}

.trusty-switch-thumb[data-state='checked'] {
  /* slide flush to the far edge: track width − thumb width − 2× padding, so the gap matches the resting gap on the other side */
  transform: translateX(calc(var(--space-2xl) - var(--space-md) - 2 * var(--space-xs)));
  background-color: var(--color-on-primary);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-switch-track,
  .trusty-switch-thumb {
    transition: none;
  }
}
</style>
