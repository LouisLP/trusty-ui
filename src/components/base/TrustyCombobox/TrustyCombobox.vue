<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/combobox

import {
  ComboboxAnchor,
  ComboboxCancel,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from 'reka-ui'
import { computed, ref } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

// id / aria-describedby etc. fall through onto the focusable <input>.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Options, in order (so pass it in sorted) */
  items: { value: string, label: string, disabled?: boolean }[]
  /** Shown in the input while nothing is typed/selected */
  placeholder?: string
  /** Accessible name for the input (no visible label is rendered) */
  ariaLabel?: string
  /** Shown when the typed query matches no option */
  emptyText?: string
  /** Disable the WHOLE control */
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  placeholder: 'Select…',
  emptyText: 'No results.',
  disabled: false,
  required: false,
  invalid: false,
})

// The selected option's value, or undefined while nothing is chosen.
const model = defineModel<string>()

// Mirrors the input's text. Reka owns that text (it writes the selected label into it, resets it on blur/select/clear), so we only listen — a controlled v-model would fight those internal writes.
const searchTerm = ref('')

// Input shows the chosen option's LABEL (not its raw value) once selected.
function displayValue(value: string) {
  return props.items.find(item => item.value === value)?.label ?? ''
}

// Whether there is anything to clear — a typed query or a selected option's label. One half of the clear button's visibility; hover/focus is the other, and lives in CSS.
const hasText = computed(() =>
  searchTerm.value !== '' || (model.value != null && displayValue(model.value) !== ''))
</script>

<template>
  <ComboboxRoot
    v-model="model"
    :disabled="disabled"
    :reset-search-term-on-blur="true"
    :reset-model-value-on-clear="true"
    class="trusty-combobox-root"
  >
    <ComboboxAnchor
      class="trusty-combobox-anchor"
      :data-invalid="invalid || undefined"
    >
      <ComboboxInput
        v-bind="$attrs"
        class="trusty-combobox-input"
        :placeholder="placeholder"
        :display-value="displayValue"
        :aria-label="ariaLabel"
        :required="required || undefined"
        :aria-invalid="invalid || undefined"
        @update:model-value="searchTerm = $event"
      />

      <!-- Only revealed on hover/focus, and only with text to clear — but always in the layout (visibility, not v-if) so the input's width — and with it the placeholder — doesn't jump. -->
      <ComboboxCancel
        class="trusty-combobox-cancel"
        aria-label="Clear"
        :disabled="disabled"
        :data-empty="!hasText || undefined"
      >
        <TrustyIcon
          name="ph:x-circle"
          size="sm"
        />
      </ComboboxCancel>

      <ComboboxTrigger
        class="trusty-combobox-trigger"
        aria-label="Toggle options"
      >
        <TrustyIcon
          name="ph:caret-down"
          size="sm"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxPortal>
      <!-- position="popper" anchors the list to the anchor and exposes --reka-combobox-trigger-width so the list can match its width. -->
      <ComboboxContent
        position="popper"
        :side-offset="6"
        :as-child="true"
      >
        <div class="trusty-combobox-content">
          <ComboboxEmpty class="trusty-combobox-empty">
            {{ emptyText }}
          </ComboboxEmpty>

          <ComboboxViewport class="trusty-combobox-viewport">
            <ComboboxItem
              v-for="item in items"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled || undefined"
              class="trusty-combobox-item"
            >
              <span class="trusty-combobox-item-label">{{ item.label }}</span>
              <ComboboxItemIndicator class="trusty-combobox-item-indicator">
                <TrustyIcon name="ph:check" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxViewport>
        </div>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>

<style scoped>
.trusty-combobox-root {
  display: inline-block;
  inline-size: 100%;
}

.trusty-combobox-anchor {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  inline-size: 100%;
  min-block-size: var(--size-control-md);
  padding-inline: var(--space-sm);
  background-color: var(--color-secondary);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  transition: border-color var(--duration-fast) ease-out;
}

/* Hover hints (dimmed), focus commits (primary) — same as the other inputs. */
.trusty-combobox-anchor:hover:not(:focus-within, :has(.trusty-combobox-input:disabled)) {
  border-color: var(--color-text-muted);
}

.trusty-combobox-anchor:focus-within {
  border-color: var(--color-primary-highlight);
}

/* Error state: aria-invalid on the input is mirrored to the anchor. */
.trusty-combobox-anchor[data-invalid] {
  border-color: var(--color-border-danger);
}

.trusty-combobox-anchor:has(.trusty-combobox-input:disabled) {
  cursor: not-allowed;
  background-color: var(--color-secondary-muted);
  border-color: var(--color-border);
}

.trusty-combobox-input {
  flex: 1;
  min-inline-size: 0;
  padding-block: var(--space-xs);
  text-overflow: ellipsis;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  appearance: none;
  /* stylelint-disable-next-line a11y/no-outline-none -- ring lives on the anchor */
  outline: none;
  background-color: transparent;
  border: none;
}

.trusty-combobox-input::placeholder {
  color: var(--color-text-muted);
}

.trusty-combobox-input:disabled {
  cursor: not-allowed;
}

/* Clear button + dropdown toggle — bare icon buttons inside the anchor. */
.trusty-combobox-cancel,
.trusty-combobox-trigger {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  cursor: pointer;
  background: transparent;
  border: none;
}

.trusty-combobox-cancel:hover:not(:disabled),
.trusty-combobox-trigger:hover:not(:disabled),
.trusty-combobox-cancel:focus:not(:disabled),
.trusty-combobox-trigger:focus:not(:disabled) {
  color: var(--color-text);
}

.trusty-combobox-cancel:disabled,
.trusty-combobox-trigger:disabled {
  color: var(--color-text-muted);
  pointer-events: none;
  cursor: not-allowed;
}

/* The clear button belongs to the field's active state: it shows only while the field is hovered or focused AND has text to clear, and never on a disabled field. Hidden rather than removed so the input's width doesn't change (and the placeholder doesn't jump). */
.trusty-combobox-cancel[data-empty],
.trusty-combobox-anchor:not(:hover, :focus-within) .trusty-combobox-cancel,
.trusty-combobox-anchor:has(.trusty-combobox-input:disabled) .trusty-combobox-cancel {
  visibility: hidden;
}

/* Menu surface matches TrustyDropdownMenu (the design's shared menu chrome). */
.trusty-combobox-content {
  z-index: var(--layer-dropdown);
  min-inline-size: var(--reka-combobox-trigger-width);
  max-block-size: var(--reka-combobox-content-available-height);
  padding: var(--space-2xs);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-bg);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 var(--space-2xs) var(--space-sm) var(--color-shadow);
  transform-origin: var(--reka-combobox-content-transform-origin);
  animation: trusty-combobox-in var(--duration-fast) ease-out;
}

.trusty-combobox-empty {
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  color: var(--color-text-muted);
  text-align: center;
}

.trusty-combobox-viewport {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.trusty-combobox-item {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
  outline: none;
  border-radius: var(--radius-xs);
  transition: background-color var(--duration-fast) ease-out;
}

.trusty-combobox-item-label {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Reka moves the active row's highlight here (keyboard + pointer both land on data-highlighted), so we don't style :hover/:focus separately. */
.trusty-combobox-item[data-highlighted] {
  background-color: var(--color-bg-elevated);
}

.trusty-combobox-item[data-state='checked'] {
  color: var(--color-primary-highlight);
}

.trusty-combobox-item[data-disabled] {
  color: var(--color-text-muted);
  pointer-events: none;
  cursor: not-allowed;
}

.trusty-combobox-item-indicator {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--space-md);
}

@keyframes trusty-combobox-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-combobox-content {
    animation: none;
  }

  .trusty-combobox-anchor,
  .trusty-combobox-item {
    transition: none;
  }
}
</style>
