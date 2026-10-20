<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/toggle

import type { TrustyIconName } from '../../../icons'
import { Toggle } from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

withDefaults(defineProps<{
  /** Text label. Omit for an icon-only toggle (pair `icon` with `aria-label`). */
  label?: string
  /** Icon, before the label. Any Iconify `collection:icon` name. */
  icon?: TrustyIconName
  disabled?: boolean
}>(), {
  disabled: false,
})

// Pressed (on/off) state.
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <Toggle
    v-model="model"
    :disabled="disabled"
    :data-icon-only="(icon && !label) || undefined"
    class="trusty-toggle"
  >
    <TrustyIcon
      v-if="icon"
      :name="icon"
      class="trusty-toggle-icon"
    />
    <span
      v-if="label"
      class="trusty-toggle-label"
    >
      {{ label }}
    </span>
  </Toggle>
</template>

<style scoped>
.trusty-toggle {
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

/* Icon at 18px, independent of the (smaller) label font-size — TrustyIcon sizes at 1em of this box. */
.trusty-toggle-icon {
  font-size: var(--font-size-lg);
}

.trusty-toggle[data-icon-only] {
  gap: var(--space-sm);
  aspect-ratio: 1;
  padding-inline: 0;
}

/* pressed = on. Not --color-text-muted: that is a text colour, and the label on top of it fell to 2.08:1. */
.trusty-toggle[data-state='on'] {
  background-color: var(--color-secondary-muted);
}

/* Hover shows a neutral surface for both on and off. This is the design's translucent chip (40% text-muted) resolved as a solid over the accented base, so a standalone toggle hovers identically to a grouped one regardless of the page background behind it. */
/* stylelint-disable-next-line a11y/selector-pseudo-class-focus -- keyboard
   focus already gets an equivalent ring from the base :focus rule below */
.trusty-toggle:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-text-muted) 40%, var(--color-bg-accented));
}

/* Authored on :focus so the a11y linter sees it paired with :hover, then hidden for pointer focus — only keyboard users get the ring. */
.trusty-toggle:focus:not(:disabled) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-toggle:focus:not(:focus-visible) {
  outline-color: transparent;
}

.trusty-toggle:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.trusty-toggle[data-state='on']:disabled {
  color: var(--color-border);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-toggle {
    transition: none;
  }
}
</style>
