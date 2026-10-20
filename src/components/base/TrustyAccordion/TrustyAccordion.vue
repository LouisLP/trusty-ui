<script setup lang="ts" generic="T extends string">
// REFERENCE: https://reka-ui.com/docs/components/accordion

import type { TrustyIconName } from '../../../icons'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

withDefaults(defineProps<{
  /**
   * The panels, in order. Each item:
   * - `value`: unique value v-model reports when the panel is open; also the
   * name of the slot that fills this panel's body (one named slot per value)
   * - `label`: header text
   * - `icon`: leading icon name (Iconify `collection:icon`, e.g. `ph:gear`)
   * - `description`: muted paragraph shown above the slot
   * - `disabled`: disable just this panel
   */
  items: { value: T, label: string, icon?: TrustyIconName, description?: string, disabled?: boolean }[]
  /** `single` = at most one panel open; `multiple` = any number. */
  type?: 'single' | 'multiple'
  /** Disable every panel. */
  disabled?: boolean
}>(), {
  type: 'single',
  disabled: false,
})

// The shape follows `type`: the open panel's value, or the open panels'.
const model = defineModel<T | T[]>()
</script>

<template>
  <AccordionRoot
    v-model="model"
    :type="type"
    :disabled="disabled"
    :collapsible="true"
    class="trusty-accordion"
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled || undefined"
      class="trusty-accordion-item"
    >
      <AccordionHeader class="trusty-accordion-header">
        <AccordionTrigger class="trusty-accordion-trigger">
          <TrustyIcon
            v-if="item.icon"
            :name="item.icon"
            class="trusty-accordion-icon"
          />
          <span class="trusty-accordion-label">{{ item.label }}</span>
          <TrustyIcon
            name="ph:caret-down"
            class="trusty-accordion-marker"
          />
        </AccordionTrigger>
      </AccordionHeader>

      <AccordionContent class="trusty-accordion-content">
        <div class="trusty-accordion-panel">
          <p
            v-if="item.description"
            class="trusty-accordion-description"
          >
            {{ item.description }}
          </p>
          <slot :name="item.value" />
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>

<style scoped>
/* The 2px gaps let the page background read as hairlines between panels, so the group clips its own corners rather than each panel rounding separately. */
.trusty-accordion {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value -- design's 180px floor; no --size-* step for it */
  min-inline-size: 11.25rem;
  overflow: hidden;
  font-family: var(--font-family-sans);
  border-radius: var(--radius-sm);
}

.trusty-accordion-item {
  background-color: var(--color-bg-elevated);
}

/* Reka renders an <h3> here; the trigger inside owns all the type. */
.trusty-accordion-header {
  margin: 0;
  font: inherit;
}

/* Reka renders a real <button type="button">, so the whole header row is the keyboard target — Space/Enter toggle, arrow keys walk the panels. */
.trusty-accordion-trigger {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  inline-size: 100%;
  padding: var(--space-sm);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  text-align: start;
  appearance: none;
  cursor: pointer;
  background-color: transparent;
  border: none;
}

/* No hover surface, by design — the cursor and the marker carry the affordance. */

/* Inset ring so the 2px focus border does not change the 36px header height. */
.trusty-accordion-trigger:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

.trusty-accordion-trigger:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled reads through colour, not opacity (matches TrustyButton). */
.trusty-accordion-trigger:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* Icons render at 18px; TrustyIcon sizes at 1em, so font-size is the knob. */
.trusty-accordion-icon,
.trusty-accordion-marker {
  font-size: var(--font-size-lg);
}

/* The label stretches, pushing the marker to the trailing edge. */
.trusty-accordion-label {
  flex: 1;
  min-inline-size: 0;
  overflow-wrap: break-word;
}

/* The design draws the same downward arrow open and closed; flipping it is the only cue that survives when the panel's content is off-screen. */
.trusty-accordion-marker {
  transition: rotate var(--duration-fast) ease-out;
}

.trusty-accordion-trigger[data-state='open'] .trusty-accordion-marker {
  rotate: 180deg;
}

/* Height is animated off Reka's measured variable, so panels slide rather than snapping. Reka holds the unmount until the closing animation ends. */
.trusty-accordion-content {
  overflow: hidden;
}

.trusty-accordion-content[data-state='open'] {
  animation: trusty-accordion-open var(--duration-normal) ease-out;
}

.trusty-accordion-content[data-state='closed'] {
  animation: trusty-accordion-close var(--duration-normal) ease-out;
}

/* The header's own bottom padding supplies the gap above this column. */
.trusty-accordion-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-block-end: var(--space-sm);
  padding-inline: var(--space-sm);
}

.trusty-accordion-description {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
}

@keyframes trusty-accordion-open {
  from {
    block-size: 0;
  }

  to {
    block-size: var(--reka-accordion-content-height);
  }
}

@keyframes trusty-accordion-close {
  from {
    block-size: var(--reka-accordion-content-height);
  }

  to {
    block-size: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-accordion-marker {
    transition: none;
  }

  .trusty-accordion-content[data-state='open'],
  .trusty-accordion-content[data-state='closed'] {
    animation: none;
  }
}
</style>
