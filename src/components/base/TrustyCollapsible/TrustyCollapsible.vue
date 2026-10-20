<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/collapsible

import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

withDefaults(defineProps<{
  /** The trigger's text, and its accessible name. */
  description: string
  disabled?: boolean
}>(), {
  disabled: false,
})

// Toggles itself when left unbound; bind `v-model:open` to drive it from outside — including to start it open, which is the only way to seed it.
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <CollapsibleRoot
    v-model:open="open"
    :disabled="disabled"
    class="trusty-collapsible"
  >
    <CollapsibleTrigger class="trusty-collapsible-trigger">
      <TrustyIcon
        name="ph:caret-right"
        class="trusty-collapsible-marker"
      />
      <span class="trusty-collapsible-description">{{ description }}</span>
    </CollapsibleTrigger>

    <CollapsibleContent class="trusty-collapsible-content">
      <div class="trusty-collapsible-panel">
        <slot />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>

<style scoped>
/* No surface of its own — it sits inside whatever panel hosts it. */
.trusty-collapsible {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-family: var(--font-family-sans);
}

/* Reka renders a real <button type="button">, so the whole row is the keyboard target — Space/Enter toggle for free. */
.trusty-collapsible-trigger {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  padding: 0;
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  text-align: start;
  appearance: none;
  cursor: pointer;
  background-color: transparent;
  border: none;

  /* Rounds only the focus ring — the trigger paints no fill or border. */
  border-radius: var(--radius-xs);
}

/* The design gives no focus state; the library's ring sits just outside the text row, since there is no surface here to inset it into. */
.trusty-collapsible-trigger:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-collapsible-trigger:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled reads through colour, not opacity (matches TrustyButton). */
.trusty-collapsible-trigger:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* The marker leads the row here, unlike TrustyAccordion's trailing one. Closed points right, open points down — the design's two glyphs are one chevron rotated, so rotating it animates the same shapes. TrustyIcon sizes at 1em, so font-size is its 18px knob. */
.trusty-collapsible-marker {
  font-size: var(--font-size-lg);
  transition: rotate var(--duration-fast) ease-out;
}

.trusty-collapsible-trigger[data-state='open'] .trusty-collapsible-marker {
  rotate: 90deg;
}

.trusty-collapsible-description {
  overflow-wrap: break-word;
}

/* Height is animated off Reka's measured variable, so the section slides rather than snapping. Reka holds the unmount until the animation ends. */
.trusty-collapsible-content {
  overflow: hidden;
}

.trusty-collapsible-content[data-state='open'] {
  animation: trusty-collapsible-open var(--duration-normal) ease-out;
}

.trusty-collapsible-content[data-state='closed'] {
  animation: trusty-collapsible-close var(--duration-normal) ease-out;
}

.trusty-collapsible-panel {
  display: flex;
  flex-direction: column;
  min-block-size: var(--size-control-md);
  padding: var(--space-sm);
}

@keyframes trusty-collapsible-open {
  from {
    block-size: 0;
  }

  to {
    block-size: var(--reka-collapsible-content-height);
  }
}

@keyframes trusty-collapsible-close {
  from {
    block-size: var(--reka-collapsible-content-height);
  }

  to {
    block-size: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-collapsible-marker {
    transition: none;
  }

  .trusty-collapsible-content[data-state='open'],
  .trusty-collapsible-content[data-state='closed'] {
    animation: none;
  }
}
</style>
