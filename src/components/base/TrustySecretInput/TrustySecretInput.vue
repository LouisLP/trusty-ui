<script setup lang="ts">
// Public masked text field: TextInputBase plus a reveal toggle in its `#suffix` slot. The toggle is all that is specific to a secret; the mono value is a base variant.

import { ref } from 'vue'
import TextInputBase from '../../private/TextInputBase/TextInputBase.vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
  /** Label for the reveal toggle (announced to screen readers). */
  toggleLabel?: string
}>(), {
  disabled: false,
  required: false,
  invalid: false,
  toggleLabel: 'Show secret',
})

const model = defineModel<string>({ default: '' })
const revealed = ref(false)
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <TextInputBase
    v-bind="$attrs"
    v-model="model"
    :type="revealed ? 'text' : 'password'"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :invalid="invalid"
    :mono="true"
    autocomplete="off"
    autocapitalize="off"
    autocorrect="off"
    spellcheck="false"
  >
    <template #suffix>
      <button
        type="button"
        class="trusty-secret-input-toggle"
        :disabled="disabled || undefined"
        :aria-label="toggleLabel"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <TrustyIcon :name="revealed ? 'ph:eye-slash' : 'ph:eye'" />
      </button>
    </template>
  </TextInputBase>
</template>

<style scoped>
/* Only the toggle is ours — the shell, its states and the mono value all come from TextInputBase. The toggle is slot content, so it carries THIS component's scope id and scoped rules reach it normally. */
.trusty-secret-input-toggle {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs);
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

.trusty-secret-input-toggle:hover:not(:disabled),
.trusty-secret-input-toggle:focus:not(:disabled) {
  color: var(--color-text);
}

.trusty-secret-input-toggle:focus-visible {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-secret-input-toggle:disabled {
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-secret-input-toggle {
    transition: none;
  }
}
</style>
