<script setup lang="ts">
import type { AlertBaseProps, AlertBaseVariant } from '../../private/AlertBase/AlertBase.types'
import { computed, watchEffect } from 'vue'
import AlertBase from '../../private/AlertBase/AlertBase.vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'

/** Static inline message: title, optional description, no actions. Dismissible when the severity allows it — see `dismissible`. When the user must respond, use TrustyAlert; for transient 5-7 word notices, use TrustyToast. */
const props = withDefaults(defineProps<AlertBaseProps & {
  /** Override the severity's dismiss default. `error` ignores it — an error banner is never dismissible. */
  dismissible?: boolean
}>(), {
  // Explicitly undefined, because Vue casts an absent Boolean prop to `false`: without this, "the caller said nothing" and "the caller said no" would be the same value and the severity default could never apply.
  dismissible: undefined,
})

/** Two-way: the dismiss button flips it to false, and a closed banner renders nothing. Bind it to decide for yourself when the notice comes back. */
const open = defineModel<boolean>('open', { default: true })

// Severity decides who gets a dismiss button. A notice the user can simply ignore or
// resolve is theirs to close; a system problem is not. Warning sits between the two, so
// it stays persistent until the caller says otherwise, and error is not negotiable at all.
const DISMISSIBLE_BY_DEFAULT: Record<AlertBaseVariant, boolean> = {
  info: true,
  success: true,
  warning: false,
  error: false,
}

const isDismissible = computed(() =>
  props.variant === 'error'
    ? false
    : props.dismissible ?? DISMISSIBLE_BY_DEFAULT[props.variant ?? 'info'])

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (props.variant === 'error' && props.dismissible) {
      console.warn(
        '[TrustyBanner] `dismissible` is ignored on the error variant: an error banner is '
        + 'always persistent. Use the warning variant if the user may dismiss the message.',
      )
    }
  })
}

// Only AlertBase's own props may be forwarded — anything else would land on its root as an attribute.
const alertProps = computed<AlertBaseProps>(() => ({
  title: props.title,
  description: props.description,
  variant: props.variant,
}))
</script>

<template>
  <AlertBase
    v-if="open"
    v-bind="alertProps"
    class="trusty-banner"
  >
    <template
      v-if="isDismissible"
      #end
    >
      <TrustyButton
        variant="ghost"
        size="sm"
        icon="ph:x"
        aria-label="Dismiss"
        class="trusty-banner-dismiss"
        @click="open = false"
      />
    </template>
  </AlertBase>
</template>

<style scoped>
.trusty-banner-dismiss {
  /* TrustyIcon tracks font-size, and the design puts an 18px close glyph in the 24px control — the sm size's block padding has to go for it to fit without growing the button. */
  padding-block: 0;
  font-size: var(--font-size-lg);
}
</style>
