<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/context-menu

import type { TrustyMenuItem } from '../menu-items'
import {
  ContextMenuContent,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuTrigger,
} from 'reka-ui'
import ContextMenuRows from './ContextMenuRows.vue'

withDefaults(defineProps<{
  /** Menu rows, in order: actions, submenus, separators, and section labels */
  items: TrustyMenuItem[]
  /** Disable the WHOLE menu (right-click falls back to the browser menu) */
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  /** A selectable row was chosen; carries that row's `value`. Rows inside a submenu report through here too. */
  select: [value: string]
}>()
</script>

<template>
  <ContextMenuRoot>
    <!-- as-child: merge the right-click wiring onto the consumer's own element (the area the menu belongs to) instead of wrapping it. -->
    <ContextMenuTrigger
      :as-child="true"
      :disabled="disabled"
    >
      <slot />
    </ContextMenuTrigger>

    <ContextMenuPortal>
      <!-- as-child: render our own element as the menu so Vue's scoped data-v attribute lands on it (and on each Reka child component's root), letting plain scoped selectors style the portalled menu. -->
      <ContextMenuContent :as-child="true">
        <ContextMenuRows
          :items="items"
          @select="value => emit('select', value)"
        />
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
