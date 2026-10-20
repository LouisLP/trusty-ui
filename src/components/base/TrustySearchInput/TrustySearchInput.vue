<script setup lang="ts">
// Public search field: a leading magnifier icon plus a clear button that appears once there's something to clear. Composes the private TextInputBase (shared shell) so the search-specific chrome lives here, not on the plain TrustyTextInput. Same layer-1 contract as TrustyTextInput.

import TextInputBase from '../../private/TextInputBase/TextInputBase.vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  placeholder: 'Search…',
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
    type="search"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :invalid="invalid"
  >
    <template #prefix>
      <TrustyIcon
        name="ph:magnifying-glass"
        class="trusty-search-input-icon"
      />
    </template>
    <template
      v-if="model && !disabled"
      #suffix
    >
      <button
        type="button"
        class="trusty-search-input-clear"
        aria-label="Clear search"
        @click="model = ''"
      >
        <TrustyIcon name="ph:x-circle" />
      </button>
    </template>
  </TextInputBase>
</template>

<style scoped>
/* Match the icon sizing used across the other input controls (TrustySecretInput toggle, NumberFieldBase steppers): --font-size-lg == 18px. TrustyIcon tracks font-size at its default 1em. */
.trusty-search-input-icon {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
}

.trusty-search-input-clear {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  appearance: none;
  cursor: pointer;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) ease-out;
}

.trusty-search-input-clear:hover,
.trusty-search-input-clear:focus {
  color: var(--color-text);
}

.trusty-search-input-clear:focus-visible {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-search-input-clear {
    transition: none;
  }
}
</style>
