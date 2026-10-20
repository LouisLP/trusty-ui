<script setup lang="ts">
import type { TrustyIconName } from '../../../icons'
import { computed } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustyBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{
  /** Status text the badge shows. Plain string only: keeps every badge on the design system. */
  label: string
  /** Colour role / status the badge conveys. */
  variant?: TrustyBadgeVariant
  /** Optional leading status glyph. */
  icon?: TrustyIconName
}>(), {
  variant: 'neutral',
})

const hasIcon = computed(() => Boolean(props.icon))
</script>

<template>
  <span
    class="trusty-badge"
    :data-variant="variant"
  >
    <TrustyIcon
      v-if="hasIcon"
      :name="icon!"
      class="trusty-badge-icon"
    />
    {{ label }}
  </span>
</template>

<style scoped>
.trusty-badge {
  /* Per-instance colour channel; neutral is the resting role, each other variant repaints both below. */
  --abadge-surface: var(--color-bg-accented);

  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-tight);
  color: var(--color-on-status);
  white-space: nowrap;
  background-color: var(--abadge-surface);
  border-radius: var(--radius-full);
}

/* ── variants: paint the colour channel ── */
.trusty-badge[data-variant='info'] {
  --abadge-surface: var(--color-info-surface);
}

.trusty-badge[data-variant='success'] {
  --abadge-surface: var(--color-success-surface);
}

.trusty-badge[data-variant='warning'] {
  --abadge-surface: var(--color-warning-surface);
}

.trusty-badge[data-variant='error'] {
  --abadge-surface: var(--color-danger-surface);
}

.trusty-badge-icon {
  flex: none;
  font-size: inherit;
}
</style>
