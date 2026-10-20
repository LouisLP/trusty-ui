<script setup lang="ts">
// A single toast that brings its own viewport, driven by `open`. For toasts raised from TS rather than a template, mount one TrustyToaster and call useTrustyToast() — see TrustyToaster.
// REFERENCE: https://reka-ui.com/docs/components/toast

import type { TrustyToastVariant } from '../../private/ToastBase/ToastBase.types'
import { computed } from 'vue'
import ToastBase from '../../private/ToastBase/ToastBase.vue'

const props = withDefaults(defineProps<{
  /** The toast headline. Plain string only: keeps every toast on the design system. */
  title: string
  /** Optional secondary line under the title. */
  description?: string
  /** Colour role / severity of the toast. */
  variant?: TrustyToastVariant
}>(), {
  variant: 'info',
})

// open is two-way: Reka flips it to false on auto-close, swipe, Escape and the close button.
const open = defineModel<boolean>('open', { default: false })

// The host takes a list, so a single declarative toast is a list of one.
const toasts = computed(() => [{
  id: 'trusty-toast',
  title: props.title,
  description: props.description,
  variant: props.variant,
  open: open.value,
}])
</script>

<template>
  <ToastBase
    :toasts="toasts"
    @close="open = false"
  />
</template>
