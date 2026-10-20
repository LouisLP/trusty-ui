<script setup lang="ts">
// PRIVATE to TrustyDropdownMenu — not exported. Holds the surface as well as the rows, because a submenu pane is that same surface and scoped styles cannot cross a component boundary. Recurses on itself by filename.

import type { TrustyMenuItem } from '../menu-items'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from 'reka-ui'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'
import TrustyKeyboardBadge from '../../base/TrustyKeyboardBadge/TrustyKeyboardBadge.vue'

defineProps<{
  /** The rows of THIS pane — the root menu's items, or one submenu's `children`. */
  items: TrustyMenuItem[]
}>()

const emit = defineEmits<{
  select: [value: string]
}>()
</script>

<template>
  <div class="trusty-dropdown-menu">
    <template
      v-for="(item, index) in items"
      :key="index"
    >
      <DropdownMenuSeparator
        v-if="item.type === 'separator'"
        class="trusty-dropdown-menu-separator"
      />
      <DropdownMenuLabel
        v-else-if="item.type === 'label'"
        class="trusty-dropdown-menu-section"
      >
        {{ item.label }}
      </DropdownMenuLabel>

      <DropdownMenuSub v-else-if="item.type === 'submenu'">
        <DropdownMenuSubTrigger
          class="trusty-dropdown-menu-item"
          :disabled="item.disabled || undefined"
        >
          <TrustyIcon
            v-if="item.icon"
            :name="item.icon"
          />
          {{ item.label }}
          <span class="trusty-dropdown-menu-item-trailing">
            <TrustyIcon
              name="ph:caret-right"
              class="trusty-dropdown-menu-item-marker"
            />
          </span>
        </DropdownMenuSubTrigger>

        <DropdownMenuPortal>
          <DropdownMenuSubContent
            :as-child="true"
            :side-offset="2"
          >
            <DropdownMenuRows
              :items="item.children"
              @select="value => emit('select', value)"
            />
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuItem
        v-else
        class="trusty-dropdown-menu-item"
        :disabled="item.disabled || undefined"
        :data-variant="item.variant"
        @select="emit('select', item.value)"
      >
        <TrustyIcon
          v-if="item.icon"
          :name="item.icon"
        />
        {{ item.label }}
        <span
          v-if="item.shortcut"
          class="trusty-dropdown-menu-item-trailing"
        >
          <TrustyKeyboardBadge :keys="item.shortcut" />
        </span>
      </DropdownMenuItem>
    </template>
  </div>
</template>

<style scoped>
.trusty-dropdown-menu {
  z-index: var(--layer-dropdown);
  min-inline-size: var(--size-2xs);
  /* A long menu stops at the space Reka measured between the trigger and the viewport edge, and scrolls the rest — same cap TrustySelect uses. Submenu panes get the var too, so this one rule covers every pane. */
  max-block-size: var(--reka-dropdown-menu-content-available-height);
  padding: var(--space-2xs);
  overflow: hidden auto;
  overscroll-behavior: contain;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background-color: var(--color-bg);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 var(--space-2xs) var(--space-sm) var(--color-shadow);
  transform-origin: var(--reka-dropdown-menu-content-transform-origin);
  animation: trusty-dropdown-menu-in var(--duration-fast) ease-out;
  scrollbar-width: thin;
  scrollbar-color: var(--color-text-muted) transparent;
}

.trusty-dropdown-menu-item {
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

.trusty-dropdown-menu-item[data-highlighted],
/* A submenu trigger stays lit while its pane is open, after the pointer has left it. */
.trusty-dropdown-menu-item[data-state='open'] {
  background-color: var(--color-bg-elevated);
}

.trusty-dropdown-menu-item[data-variant='danger'] {
  color: var(--color-danger-text);
}

.trusty-dropdown-menu-item[data-variant='danger']:hover,
.trusty-dropdown-menu-item[data-variant='danger']:focus {
  color: var(--color-text);
}

.trusty-dropdown-menu-item[data-variant='danger'][data-highlighted] {
  background-color: var(--color-danger-surface);
}

/* One trailing slot per row, holding a shortcut hint or the submenu chevron. All the geometry lives here, on a span that sizes to its content — never on the glyph, whose 1em box padding would collapse. */
.trusty-dropdown-menu-item-trailing {
  display: flex;
  align-items: center;
  padding-inline-start: var(--space-md);
  margin-inline-start: auto;
}

.trusty-dropdown-menu-item-marker {
  color: var(--color-text);
}

.trusty-dropdown-menu-item[data-disabled] {
  color: var(--color-text-muted);
  pointer-events: none;
  cursor: not-allowed;
}

.trusty-dropdown-menu-section {
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.trusty-dropdown-menu-separator {
  block-size: var(--border-sm);
  margin-block: var(--space-2xs);
  margin-inline: calc(-1 * var(--space-2xs));
  background-color: var(--color-border);
}

@keyframes trusty-dropdown-menu-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-dropdown-menu {
    animation: none;
  }

  .trusty-dropdown-menu-item {
    transition: none;
  }
}
</style>
