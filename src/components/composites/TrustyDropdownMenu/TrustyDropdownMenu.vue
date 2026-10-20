<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/dropdown-menu

import type { TrustyMenuItem } from '../menu-items'
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'
import DropdownMenuRows from './DropdownMenuRows.vue'

type TrustyDropdownMenuSide = 'top' | 'right' | 'bottom' | 'left'

withDefaults(defineProps<{
  /** Menu rows, in order: actions, submenus, separators, and section labels */
  items: TrustyMenuItem[]
  /** Which edge of the trigger the menu opens from */
  side?: TrustyDropdownMenuSide
  /** Disable the WHOLE menu (the trigger still renders) */
  disabled?: boolean
}>(), {
  side: 'bottom',
  disabled: false,
})

const emit = defineEmits<{
  /** A selectable row was chosen; carries that row's `value`. Rows inside a submenu report through here too. */
  select: [value: string]
}>()
</script>

<template>
  <DropdownMenuRoot>
    <!-- as-child: merge the menu wiring onto the consumer's own focusable trigger (e.g. a TrustyButton) instead of wrapping it in an extra one. -->
    <DropdownMenuTrigger
      :as-child="true"
      :disabled="disabled"
    >
      <slot />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <!-- as-child: render our own element as the menu so Vue's scoped data-v attribute lands on it (and on each Reka child component's root), letting plain scoped selectors style the portalled menu. -->
      <DropdownMenuContent
        :side="side"
        align="start"
        :side-offset="6"
        :as-child="true"
      >
        <DropdownMenuRows
          :items="items"
          @select="value => emit('select', value)"
        />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
