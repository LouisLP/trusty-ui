<script setup lang="ts">
// PRIVATE primitive — NOT exported from the library. Owns the shared inline-message shape (variant surface, status glyph, title/description column) that TrustyAlert, TrustyBanner and the toast host all render. Deliberately silent about what fills its two slots: the default slot renders after the description and only TrustyAlert fills it, the `end` slot pins a control to the end of the header row and TrustyBanner and ToastBase fill it with a dismiss button.

import type { TrustyIconName } from '../../../icons'
import type { AlertBaseProps, AlertBaseVariant } from './AlertBase.types'
import { computed } from 'vue'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'

const props = withDefaults(defineProps<AlertBaseProps & {
  /** Announce the message as its own live region. Off when an outer primitive already owns one — TrustyToast, where Reka announces the toast. */
  live?: boolean
}>(), {
  variant: 'info',
  live: true,
})

// One status glyph per variant.
const ICONS: Record<AlertBaseVariant, TrustyIconName> = {
  info: 'ph:info',
  success: 'ph:check-circle',
  warning: 'ph:warning',
  error: 'ph:warning-circle',
}
const iconName = computed(() => ICONS[props.variant])

// Problems interrupt assistive tech; neutral/positive messages wait their turn.
const role = computed(() => {
  if (!props.live)
    return undefined
  return props.variant === 'error' || props.variant === 'warning' ? 'alert' : 'status'
})
</script>

<template>
  <div
    class="alert-base"
    :data-variant="variant"
    :role="role"
  >
    <TrustyIcon
      :name="iconName"
      size="md"
      class="alert-base-icon"
    />

    <div class="alert-base-content">
      <strong class="alert-base-title">{{ title }}</strong>

      <p
        v-if="description"
        class="alert-base-description"
      >
        {{ description }}
      </p>

      <slot />
    </div>

    <slot name="end" />
  </div>
</template>

<style scoped>
.alert-base {
  /* Per-instance surface channel; info is the resting role, each other variant paints it below. */
  --alert-surface: var(--color-info-surface);

  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
  max-inline-size: var(--size-md);
  padding: var(--space-sm);
  font-family: var(--font-family-sans);
  color: var(--color-on-status);
  background-color: var(--alert-surface);
  border-radius: var(--radius-sm);
}

/* ── variants: paint the surface channel ── */
.alert-base[data-variant='success'] {
  --alert-surface: var(--color-success-surface);
}

.alert-base[data-variant='warning'] {
  --alert-surface: var(--color-warning-surface);
}

.alert-base[data-variant='error'] {
  --alert-surface: var(--color-danger-surface);
}

/* ── parts ── */
.alert-base-icon {
  flex: none;
}

.alert-base-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-xs);
  min-inline-size: 0;
}

.alert-base-title {
  display: flex;
  align-items: center;
  min-block-size: var(--space-lg);
  font-family: var(--font-family-display);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  overflow-wrap: break-word;
}

.alert-base-description {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  overflow-wrap: break-word;
}
</style>
