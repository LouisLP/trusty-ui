<script setup lang="ts" generic="T extends string">
// REFERENCE: https://reka-ui.com/docs/components/tabs

import type { TrustyIconName } from '../../../icons'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { computed, useSlots } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustyNavigationTabsPlacement = 'left' | 'right'
type TrustyNavigationTabsSize = 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<{
  /**
   * The tabs, in order. Each tab:
   * - `value`: unique value v-model reports for the active tab; also the
   * name of the slot that fills this tab's panel (one named slot per value;
   * omit the slot to render no panel — rail-only, content driven externally
   * via v-model) and the a11y name of an icon-only tab
   * - `label`: text (omit for icon-only)
   * - `icon`: icon name (Iconify `collection:icon`, e.g. `ph:gear`)
   * - `disabled`: disable just this tab
   */
  tabs: { value: T, label?: string, icon?: TrustyIconName, disabled?: boolean }[]
  /** Which side the rail is docked to. The active bar takes the rail's outer edge, away from the panel. */
  placement?: TrustyNavigationTabsPlacement
  size?: TrustyNavigationTabsSize
}>(), {
  placement: 'left',
  size: 'md',
})

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
    orientation="vertical"
    :data-placement="props.placement"
    :data-size="props.size"
    class="trusty-navigation-tabs"
  >
    <TabsList class="trusty-navigation-tabs-list">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :disabled="tab.disabled || undefined"
        :aria-label="tab.label ? undefined : tab.value"
        :data-icon-only="(tab.icon && !tab.label) || undefined"
        class="trusty-navigation-tabs-trigger"
      >
        <TrustyIcon
          v-if="tab.icon"
          :name="tab.icon"
          class="trusty-navigation-tabs-icon"
        />
        <span
          v-if="tab.label"
          class="trusty-navigation-tabs-label"
        >
          {{ tab.label }}
        </span>
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="tab in panelTabs"
      :key="tab.value"
      :value="tab.value"
      class="trusty-navigation-tabs-content"
    >
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
.trusty-navigation-tabs {
  display: flex;
  font-family: var(--font-family-sans);
}

/* Placement = which side the rail is docked to; the rail is always the first child. */
.trusty-navigation-tabs[data-placement='left'] {
  flex-direction: row;
}

.trusty-navigation-tabs[data-placement='right'] {
  flex-direction: row-reverse;
}

.trusty-navigation-tabs-list {
  display: flex;
  flex: none;
  flex-direction: column;
}

.trusty-navigation-tabs-trigger {
  /* Per-size padding channels; the placement rules below add an extra space-xs of clearance on whichever edge carries the bar. */
  --trusty-navigation-tabs-pad-block: var(--space-xs);
  --trusty-navigation-tabs-pad-inline: var(--space-sm);

  display: flex;
  gap: var(--space-xs);
  align-items: center;
  justify-content: flex-start;
  min-block-size: var(--size-control-md);
  padding-block: var(--trusty-navigation-tabs-pad-block);
  padding-inline: var(--trusty-navigation-tabs-pad-inline);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
  white-space: nowrap;
  appearance: none;
  cursor: pointer;
  user-select: none;
  background-color: transparent;

  /* Zero-width on every edge; a placement rule below gives the bar's edge its width, and the active rule gives it colour. Reserving it this way keeps the trigger the same size in both states. */
  border: 0 solid transparent;
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

/* ── size ── */
.trusty-navigation-tabs[data-size='lg'] .trusty-navigation-tabs-trigger {
  --trusty-navigation-tabs-pad-block: var(--space-sm);

  gap: var(--space-sm);
  min-block-size: var(--size-control-lg);
  font-size: var(--font-size-sm);
}

.trusty-navigation-tabs[data-size='xl'] .trusty-navigation-tabs-trigger {
  --trusty-navigation-tabs-pad-block: var(--space-sm);
  --trusty-navigation-tabs-pad-inline: var(--space-md);

  gap: var(--space-sm);
  min-block-size: var(--size-control-xl);
  font-size: var(--font-size-lg);
}

/* ── the bar's edge ──
   It takes the rail's outer edge, away from the panel, and the content keeps
   space-xs of clearance beyond it. */
.trusty-navigation-tabs[data-placement='left'] .trusty-navigation-tabs-trigger {
  border-inline-start-width: var(--border-md);
  padding-inline-start: calc(var(--trusty-navigation-tabs-pad-inline) + var(--space-xs));
}

.trusty-navigation-tabs[data-placement='right'] .trusty-navigation-tabs-trigger {
  border-inline-end-width: var(--border-md);
  padding-inline-end: calc(var(--trusty-navigation-tabs-pad-inline) + var(--space-xs));
}

/* An icon-only trigger collapses to a square — the bar still takes its edge, the icon stays centred. Specificity matches the placement rules so it wins the padding back. */
.trusty-navigation-tabs[data-placement] .trusty-navigation-tabs-trigger[data-icon-only] {
  align-self: center;
  aspect-ratio: 1;
  justify-content: center;
  padding-inline: 0;
}

/* Icon renders at a fixed optical size per scale (TrustyIcon sizes at 1em). */
.trusty-navigation-tabs-icon {
  font-size: var(--font-size-lg);
}

.trusty-navigation-tabs[data-size='xl'] .trusty-navigation-tabs-icon {
  font-size: var(--font-size-2xl);
}

.trusty-navigation-tabs-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Faint primary wash on hover, the same mix as TrustyButton's ghost variant. */
.trusty-navigation-tabs-trigger:hover:not([data-disabled], [data-state='active']),
.trusty-navigation-tabs-trigger:focus-visible:not([data-disabled], [data-state='active']) {
  color: var(--color-text);
  background-color: var(--color-ghost-surface-subtle);
}

/* Active: the reserved border takes colour, and the wash stays on. */
.trusty-navigation-tabs-trigger[data-state='active'] {
  color: var(--color-primary-highlight);
  background-color: var(--color-ghost-surface-subtle);
  border-color: var(--color-primary-highlight);
}

/* Keyboard focus ring, hidden for pointer focus. The radius rides with the ring: the design rounds the ring, never the fill or the bar. */
.trusty-navigation-tabs-trigger:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

.trusty-navigation-tabs-trigger:focus-visible {
  border-radius: var(--radius-sm);
}

.trusty-navigation-tabs-trigger:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled reads through colour, not opacity (matches TrustyButton). */
.trusty-navigation-tabs-trigger[data-disabled] {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.trusty-navigation-tabs-content {
  flex: 1;
  padding-block: var(--space-md);
  padding-inline: var(--space-md);
  color: var(--color-text);
}

.trusty-navigation-tabs-content:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

.trusty-navigation-tabs-content:focus:not(:focus-visible) {
  outline-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-navigation-tabs-trigger {
    transition: none;
  }
}
</style>
