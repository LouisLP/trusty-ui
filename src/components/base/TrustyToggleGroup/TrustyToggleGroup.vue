<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/toggle-group

import type { AcceptableValue } from 'reka-ui'
import type { TrustyIconName } from '../../../icons'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

const props = withDefaults(defineProps<{
  /**
   * The options, in order. Each item:
   * - `value`: unique value v-model reports when the item is on
   * - `label`: text (omit for icon-only — then `value` is its a11y name)
   * - `icon`: icon name (Iconify `collection:icon`, e.g. `ph:gear`)
   * - `disabled`: disable just this item
   */
  items: { value: string, label?: string, icon?: TrustyIconName, disabled?: boolean }[]
  /** `single` = one on once picked (radio-like — re-clicking it keeps it on); `multiple` = any number on. */
  type?: 'single' | 'multiple'
  /** Disable the whole group. */
  disabled?: boolean
}>(), {
  type: 'single',
  disabled: false,
})

// The shape follows `type`
const model = defineModel<string | string[]>()

// Reka clears a single group when its pressed item is re-clicked; drop that so a picked mode stays picked
function onUpdate(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (props.type === 'single' && value == null)
    return
  // item values are strings, so Reka only ever hands back strings
  model.value = value as string | string[]
}
</script>

<template>
  <!-- `?? null` keeps Reka controlled: given `undefined` it holds its own state, which the dropped clear would desync -->
  <ToggleGroupRoot
    :model-value="model ?? null"
    :type="type"
    :disabled="disabled"
    class="trusty-toggle-group"
    @update:model-value="onUpdate"
  >
    <ToggleGroupItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled || undefined"
      :aria-label="item.label ? undefined : item.value"
      :data-icon-only="(item.icon && !item.label) || undefined"
      class="trusty-toggle-group-item"
    >
      <TrustyIcon
        v-if="item.icon"
        :name="item.icon"
        size="sm"
      />
      <span
        v-if="item.label"
        class="trusty-toggle-group-label"
      >
        {{ item.label }}
      </span>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>

<style scoped>
.trusty-toggle-group {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-family-sans);
  background-color: var(--color-bg-accented);
  border-radius: var(--radius-md);

  /* new stacking context so items' negative-margin overlap and focus rings layer against each other, not against the surrounding page */
  isolation: isolate;
}

.trusty-toggle-group-item {
  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  justify-content: center;
  block-size: var(--size-control-md);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  white-space: nowrap;
  appearance: none;
  cursor: pointer;
  user-select: none;
  background-color: var(--color-bg-accented);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-md);
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

/* Overlap adjacent borders so neighbouring 2px edges collapse into one. */
.trusty-toggle-group-item:not(:last-child) {
  margin-inline-end: calc(-1 * var(--border-md));
}

.trusty-toggle-group-item[data-icon-only] {
  gap: var(--space-sm);
  aspect-ratio: 1;
  padding-inline: 0;
}

/* Raise the interactive/pressed item so its full border and focus ring sit above the overlapped neighbour. */
.trusty-toggle-group-item:hover:not(:disabled),
.trusty-toggle-group-item[data-state='on'],
.trusty-toggle-group-item:focus:not(:disabled) {
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value --
     local in-component stacking (0/1/2), kept below the global --layer-* scale per the tokens/semantic.css note */
  z-index: 1;
}

/* pressed = on */
.trusty-toggle-group-item[data-state='on'] {
  background-color: var(--color-secondary-muted);
}

/* Hover shows a neutral surface for both on and off — the design's translucent chip (40% text-muted) resolved as a solid over the accented base, matching the standalone TrustyToggle. */
/* stylelint-disable-next-line a11y/selector-pseudo-class-focus -- keyboard
   focus already gets an equivalent ring from the base :focus rule below */
.trusty-toggle-group-item:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-text-muted) 40%, var(--color-bg-accented));
}

/* Authored on :focus so the a11y linter sees it paired with :hover, then hidden for pointer focus — only keyboard users get the ring. */
.trusty-toggle-group-item:focus:not(:disabled) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-toggle-group-item:focus:not(:focus-visible) {
  outline-color: transparent;
}

.trusty-toggle-group-item:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.trusty-toggle-group-item[data-state='on']:disabled {
  color: var(--color-border);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-toggle-group-item {
    transition: none;
  }
}
</style>
