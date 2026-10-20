<script setup lang="ts" generic="T extends string">
// REFERENCE: https://reka-ui.com/docs/components/tabs

import type { TrustyIconName } from '../../../icons'
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, useSlots } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustyTabsPlacement = 'top' | 'right' | 'left'
type TrustyTabsSize = 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
  /**
   * The tabs, in order. Each tab:
   * - `value`: unique value v-model reports for the active tab; also the
   * name of the slot that fills this tab's panel (one named slot per value; omit the slot to render no panel — strip-only, content driven externally via v-model)
   * - `label`: text (omit for icon-only — then `value` is its a11y name)
   * - `icon`: icon name (Iconify `collection:icon`, e.g. `ph:gear`)
   * - `disabled`: disable just this tab
   */
  tabs: { value: T, label?: string, icon?: TrustyIconName, disabled?: boolean }[]
  placement?: TrustyTabsPlacement
  size?: TrustyTabsSize
}>(), {
  placement: 'top',
  size: 'md',
})

// left/right run the strip down the side → vertical; top → horizontal.
const orientation = computed(() =>
  props.placement === 'left' || props.placement === 'right' ? 'vertical' : 'horizontal',
)

// Only tabs with a matching slot get a panel.
const slots = useSlots()
const panelTabs = computed(() => props.tabs.filter(tab => slots[tab.value]))

// The active tab's value — typed by the consumer's `tabs` values, so union/enum-typed state v-models directly. Uncontrolled falls back to the first tab.
const model = defineModel<T>()
</script>

<template>
  <TabsRoot
    v-model="model"
    :default-value="props.tabs[0]?.value"
    :orientation="orientation"
    :data-placement="props.placement"
    :data-size="props.size"
    class="trusty-tabs"
  >
    <TabsList class="trusty-tabs-list">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled || undefined"
        :aria-label="tab.label ? undefined : tab.value"
        :data-icon-only="(tab.icon && !tab.label) || undefined"
        class="trusty-tabs-trigger"
      >
        <TrustyIcon
          v-if="tab.icon"
          :name="tab.icon"
          class="trusty-tabs-icon"
        />
        <span
          v-if="tab.label"
          class="trusty-tabs-label"
        >
          {{ tab.label }}
        </span>
      </TabsTrigger>
      <TabsIndicator class="trusty-tabs-indicator" />
    </TabsList>

    <TabsContent
      v-for="tab in panelTabs"
      :key="tab.value"
      :value="tab.value"
      class="trusty-tabs-content"
    >
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.trusty-tabs {
  display: flex;
  font-family: var(--font-family-sans);
}

/* Strip placement = flow direction; the strip is always the first child. */
.trusty-tabs[data-placement='top'] {
  flex-direction: column;
}

.trusty-tabs[data-placement='left'] {
  flex-direction: row;
}

.trusty-tabs[data-placement='right'] {
  flex-direction: row-reverse;
}

.trusty-tabs-list {
  position: relative;
  display: flex;
  flex: none;
}

.trusty-tabs-list[data-orientation='vertical'] {
  flex-direction: column;
}

/* The active-tab border sits on the edge the strip shares with the content. */
.trusty-tabs[data-placement='top'] .trusty-tabs-list {
  border-block-end: var(--border-sm) solid var(--color-border);
}

.trusty-tabs[data-placement='left'] .trusty-tabs-list {
  border-inline-end: var(--border-sm) solid var(--color-border);
}

.trusty-tabs[data-placement='right'] .trusty-tabs-list {
  border-inline-start: var(--border-sm) solid var(--color-border);
}

.trusty-tabs-trigger {
  /* Per-size padding channels; the placement rules below add an extra space-xs of clearance on whichever edge carries the indicator. */
  --trusty-tabs-pad-block: var(--space-xs);
  --trusty-tabs-pad-inline: var(--space-sm);

  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  justify-content: center;
  min-block-size: var(--size-control-md);
  padding-block: var(--trusty-tabs-pad-block);
  padding-inline: var(--trusty-tabs-pad-inline);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  white-space: nowrap;
  appearance: none;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: none;

  /* Rounds only the focus ring — the trigger paints no fill or border. */
  border-radius: var(--radius-sm);
  transition: color var(--duration-fast) ease-out;
}

/* ── size ── */
.trusty-tabs[data-size='lg'] .trusty-tabs-trigger {
  --trusty-tabs-pad-block: var(--space-sm);

  min-block-size: var(--size-control-lg);
}

.trusty-tabs[data-size='xl'] .trusty-tabs-trigger {
  --trusty-tabs-pad-block: var(--space-sm);
  --trusty-tabs-pad-inline: var(--space-md);

  gap: var(--space-sm);
  min-block-size: var(--size-control-xl);
  font-size: var(--font-size-lg);
}

/* Content keeps space-xs clearance from the indicator edge. */
.trusty-tabs[data-placement='top'] .trusty-tabs-trigger {
  padding-block-end: calc(var(--trusty-tabs-pad-block) + var(--space-xs));
}

.trusty-tabs[data-placement='left'] .trusty-tabs-trigger {
  justify-content: flex-end;
  padding-inline-end: calc(var(--trusty-tabs-pad-inline) + var(--space-xs));
}

.trusty-tabs[data-placement='right'] .trusty-tabs-trigger {
  justify-content: flex-start;
  padding-inline-start: calc(var(--trusty-tabs-pad-inline) + var(--space-xs));
}

/* Horizontal toolbar: icon-only triggers collapse to a square. In a vertical strip they keep their normal padding so they hold a label-like footprint. */
.trusty-tabs-list[data-orientation='horizontal'] .trusty-tabs-trigger[data-icon-only] {
  aspect-ratio: 1;
  padding-inline: 0;
}

/* Icon renders at a fixed optical size per scale (TrustyIcon sizes at 1em). */
.trusty-tabs-icon {
  font-size: var(--font-size-lg);
}

.trusty-tabs[data-size='xl'] .trusty-tabs-icon {
  font-size: var(--font-size-2xl);
}

.trusty-tabs-trigger:hover:not([data-disabled], [data-state='active']),
.trusty-tabs-trigger:focus-visible:not([data-disabled], [data-state='active']) {
  color: var(--color-text);
}

.trusty-tabs-trigger[data-state='active'] {
  color: var(--color-primary-highlight);
}

/* Keyboard focus ring, hidden for pointer focus */
.trusty-tabs-trigger:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

.trusty-tabs-trigger:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled reads through colour, not opacity (matches TrustyButton). */
.trusty-tabs-trigger[data-disabled] {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* Sliding bar tracking the active trigger; sized/positioned by Reka's vars. */
.trusty-tabs-indicator {
  position: absolute;
  background-color: var(--color-primary-highlight);
  transition: translate var(--duration-fast) ease-out;
}

.trusty-tabs-list[data-orientation='horizontal'] .trusty-tabs-indicator {
  inline-size: var(--reka-tabs-indicator-size);
  block-size: var(--border-md);
  translate: var(--reka-tabs-indicator-position) 0;
}

.trusty-tabs-list[data-orientation='vertical'] .trusty-tabs-indicator {
  inline-size: var(--border-md);
  block-size: var(--reka-tabs-indicator-size);
  translate: 0 var(--reka-tabs-indicator-position);
}

/* Indicator hugs the same edge as the strip's border. */
.trusty-tabs[data-placement='top'] .trusty-tabs-indicator {
  inset-block-end: 0;
}

.trusty-tabs[data-placement='left'] .trusty-tabs-indicator {
  inset-inline-end: 0;
}

.trusty-tabs[data-placement='right'] .trusty-tabs-indicator {
  inset-inline-start: 0;
}

.trusty-tabs-content {
  flex: 1;
  padding-block: var(--space-md);
  padding-inline: var(--space-md);
  color: var(--color-text);
}

.trusty-tabs-content:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

.trusty-tabs-content:focus:not(:focus-visible) {
  outline-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-tabs-trigger,
  .trusty-tabs-indicator {
    transition: none;
  }
}
</style>
