<script setup lang="ts">
// The app-level toast host: mount exactly one, high in the tree, then raise toasts from anywhere with useTrustyToast(). Holds no props — everything it renders comes from that queue.

import ToastBase from '../../private/ToastBase/ToastBase.vue'
import { useTrustyToast } from './useTrustyToast'

const { toasts, dismiss } = useTrustyToast()
</script>

<template>
  <ToastBase
    :toasts="toasts"
    @close="dismiss"
  />
</template>
