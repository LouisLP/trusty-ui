<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/select

import type { TrustyIconName } from '../../../icons'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { computed } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustySelectVariant = 'default' | 'ghost'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Options, in order (so pass it in sorted). `icon` puts a leading glyph on the row, and on the trigger once that row is selected. */
  items: { value: string, label: string, icon?: TrustyIconName, disabled?: boolean }[]
  /** Shown on the trigger when nothing is selected */
  placeholder?: string
  /** Accessible name for the control (no visible label is rendered) */
  ariaLabel?: string
  /** Disable the WHOLE control */
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
  /** `ghost` drops the field chrome and hugs its value, so the pick reads as text — in a toolbar or a compact form row. */
  variant?: TrustySelectVariant
}>(), {
  placeholder: 'Select…',
  variant: 'default',
  disabled: false,
  required: false,
  invalid: false,
})

// The selected option's value, or undefined while nothing is chosen.
const model = defineModel<string>()

// SelectValue only renders the label, so the trigger's icon is resolved here.
const selectedIcon = computed(() => props.items.find(item => item.value === model.value)?.icon)
</script>

<template>
  <SelectRoot
    v-model="model"
    :disabled="disabled"
    :required="required"
  >
    <SelectTrigger
      v-bind="$attrs"
      class="trusty-select-trigger"
      :aria-label="ariaLabel"
      :aria-invalid="invalid || undefined"
      :data-invalid="invalid || undefined"
      :data-variant="variant"
    >
      <TrustyIcon
        v-if="selectedIcon"
        :name="selectedIcon"
        class="trusty-select-trigger-leading-icon"
      />
      <SelectValue
        class="trusty-select-value"
        :placeholder="placeholder"
      />
      <SelectIcon class="trusty-select-trigger-icon">
        <TrustyIcon
          name="ph:caret-down"
          size="sm"
        />
      </SelectIcon>
    </SelectTrigger>

    <SelectPortal>
      <!-- position="popper" anchors the list to the trigger and exposes --reka-select-trigger-width so the list can match its width. -->
      <SelectContent
        position="popper"
        :side-offset="6"
        :as-child="true"
      >
        <div class="trusty-select-content">
          <SelectScrollUpButton class="trusty-select-scroll-button">
            <TrustyIcon name="ph:caret-up" />
          </SelectScrollUpButton>

          <SelectViewport class="trusty-select-viewport">
            <SelectItem
              v-for="item in items"
              :key="item.value"
              :value="item.value"
              :disabled="item.disabled || undefined"
              class="trusty-select-item"
            >
              <TrustyIcon
                v-if="item.icon"
                :name="item.icon"
                class="trusty-select-item-icon"
              />
              <SelectItemText class="trusty-select-item-label">
                {{ item.label }}
              </SelectItemText>
              <SelectItemIndicator class="trusty-select-item-indicator">
                <TrustyIcon name="ph:check" />
              </SelectItemIndicator>
            </SelectItem>
          </SelectViewport>

          <SelectScrollDownButton class="trusty-select-scroll-button">
            <TrustyIcon name="ph:caret-down" />
          </SelectScrollDownButton>
        </div>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style scoped>
.trusty-select-trigger {
  /* Per-variant channels; the state rules below read them, so a variant only repaints what differs. */
  --trusty-select-fg: var(--color-text-toned);
  --trusty-select-bg: var(--color-secondary);
  --trusty-select-bg-hover: var(--color-secondary);
  --trusty-select-bg-disabled: var(--color-secondary-muted);
  --trusty-select-border: var(--color-border);
  --trusty-select-border-hover: var(--color-text-muted);
  --trusty-select-border-disabled: var(--color-border);

  display: flex;
  gap: var(--space-sm);
  align-items: center;
  justify-content: space-between;
  inline-size: 100%;
  min-inline-size: var(--size-2xs);
  min-block-size: var(--size-control-md);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--trusty-select-fg);
  cursor: pointer;
  /* stylelint-disable-next-line a11y/no-outline-none -- the border is the focus ring */
  outline: none;
  background-color: var(--trusty-select-bg);
  border: var(--border-md) solid var(--trusty-select-border);
  border-radius: var(--radius-xs);
  transition:
    border-color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out;
}

/* Hover only hints while unfocused/closed — the primary border below owns the focused and open states, so hovering them doesn't drop back to gray. */
.trusty-select-trigger:hover:not([data-disabled], [data-invalid], :focus-visible, [data-state='open']),
.trusty-select-trigger:focus:not([data-disabled], [data-invalid], :focus-visible, [data-state='open']) {
  border-color: var(--trusty-select-border-hover);
}

.trusty-select-trigger:hover:not([data-disabled]),
.trusty-select-trigger[data-state='open'] {
  background-color: var(--trusty-select-bg-hover);
}

.trusty-select-trigger:focus-visible,
.trusty-select-trigger[data-state='open'] {
  border-color: var(--color-primary-highlight);
}

/* Error state: set via TrustyFormItem's slot props. */
.trusty-select-trigger[data-invalid] {
  border-color: var(--color-border-danger);
}

.trusty-select-trigger[data-disabled] {
  color: var(--color-text-muted);
  cursor: not-allowed;
  background-color: var(--trusty-select-bg-disabled);
  border-color: var(--trusty-select-border-disabled);
}

/* Dim the placeholder relative to a real selected value */
.trusty-select-trigger[data-placeholder] {
  color: var(--color-text-muted);
}

/* Truncate overly-long text */
.trusty-select-value {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: start;
  white-space: nowrap;
}

/* Ghost: no fill or visible border; the trigger hugs its value. */
.trusty-select-trigger[data-variant='ghost'] {
  --trusty-select-fg: var(--color-text);
  --trusty-select-bg: transparent;
  --trusty-select-bg-hover: var(--color-ghost-surface-subtle);
  --trusty-select-bg-disabled: transparent;
  --trusty-select-border: transparent;
  --trusty-select-border-hover: transparent;
  --trusty-select-border-disabled: transparent;

  gap: var(--space-xs);
  inline-size: auto;
  min-inline-size: 0;
  min-block-size: var(--size-control-sm);

  /* Pull the padding + border back out so it lays out at its text size. */
  margin-block: calc(-1 * var(--border-md));
  margin-inline: calc(-1 * (var(--space-xs) + var(--border-md)));
  padding-block: 0;
  padding-inline: var(--space-xs);
  font-weight: var(--font-weight-semibold);
}

/* Leading glyph mirrors the selected row's icon; it tracks the value's colour, unlike the muted chevron below. */
.trusty-select-trigger-leading-icon {
  color: inherit;
}

.trusty-select-trigger-icon {
  display: inline-flex;
  flex: none;
  color: var(--color-text-muted);
}

.trusty-select-trigger[data-disabled] .trusty-select-trigger-icon {
  color: var(--color-text-muted);
}

/* Menu surface matches TrustyDropdownMenu (the design's shared menu chrome). */
.trusty-select-content {
  z-index: var(--layer-dropdown);
  min-inline-size: var(--reka-select-trigger-width);
  max-block-size: var(--reka-select-content-available-height);
  padding: var(--space-2xs);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-bg);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 var(--space-2xs) var(--space-sm) var(--color-shadow);
  transform-origin: var(--reka-select-content-transform-origin);
  animation: trusty-select-in var(--duration-fast) ease-out;
}

.trusty-select-viewport {
  display: flex;
  flex-direction: column;
}

.trusty-select-item {
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

/* Leading glyph takes the row's colour, so checked and disabled rows carry it too. */
.trusty-select-item-icon {
  color: inherit;
}

.trusty-select-item-label {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Reka moves the active row's highlight here (keyboard + pointer both land on data-highlighted), so we don't style :hover/:focus separately. */
.trusty-select-item[data-highlighted] {
  background-color: var(--color-bg-elevated);
}

.trusty-select-item[data-state='checked'] {
  color: var(--color-primary-highlight);
}

.trusty-select-item[data-disabled] {
  color: var(--color-text-muted);
  pointer-events: none;
  cursor: not-allowed;
}

/* Checkmark sits at the end of the row, only on the selected item. */
.trusty-select-item-indicator {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--space-md);
}

.trusty-select-scroll-button {
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: var(--space-lg);
  color: var(--color-text-muted);
  cursor: default;
}

@keyframes trusty-select-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-select-content {
    animation: none;
  }

  .trusty-select-trigger,
  .trusty-select-item {
    transition: none;
  }
}
</style>
