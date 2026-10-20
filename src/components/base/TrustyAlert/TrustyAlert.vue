<script setup lang="ts">
import type { AlertBaseProps } from '../../private/AlertBase/AlertBase.types'
import AlertBase from '../../private/AlertBase/AlertBase.vue'

/** Inline dialog: always pairs its message with actions (default slot). Intended slot content: TrustyButton `secondary` `md` for the primary action, TrustyButton `ghost` `md` for secondary/negative actions ("Cancel", "Deny"). With no actions to offer, use TrustyBanner instead; for transient 5-7 word notices, use TrustyToast. */
const props = defineProps<AlertBaseProps>()
</script>

<template>
  <AlertBase
    v-bind="props"
    class="trusty-alert"
  >
    <div class="trusty-alert-actions">
      <slot />
    </div>
  </AlertBase>
</template>

<style scoped>
.trusty-alert-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  justify-content: flex-end;
}
</style>
