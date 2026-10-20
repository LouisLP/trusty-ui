<script setup lang="ts">
import type { TrustyIconName } from '../../../icons'
import { Icon } from '@iconify/vue'
import { bundledIcons } from '../../../icons'

type TrustyIconSize = 'xs' | 'sm' | 'md' | 'lg'

defineProps<{
  /** Iconify name in `collection:icon` form (`ph:house`). The names the library's own components use are bundled and render offline; any other is fetched from the Iconify API. */
  name: TrustyIconName
  /** Fixed design-token size (styled via `[data-size]` in CSS). Omit to size at `1em`, so the icon tracks the font-size of surrounding text. */
  size?: TrustyIconSize
}>()
</script>

<template>
  <span
    class="trusty-icon"
    :data-size="size"
    aria-hidden="true"
  >
    <!-- Bundled data renders synchronously; `ssr` stops <Icon> waiting for mount before it draws what it already has. -->
    <Icon
      :icon="bundledIcons[name] ?? name"
      :ssr="true"
    />
  </span>
</template>

<style scoped>
.trusty-icon {
  /* Default: track the surrounding font-size. Named sizes override below. */
  display: inline-flex;
  flex: none;
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value -- 1em tracks font-size */
  inline-size: 1em;
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value -- 1em tracks font-size */
  block-size: 1em;
  color: inherit;
}

/* ── named sizes: map to spacing tokens ── */
.trusty-icon[data-size='xs'] {
  inline-size: var(--space-sm);
  block-size: var(--space-sm);
}

.trusty-icon[data-size='sm'] {
  inline-size: var(--space-md);
  block-size: var(--space-md);
}

.trusty-icon[data-size='md'] {
  inline-size: var(--space-lg);
  block-size: var(--space-lg);
}

.trusty-icon[data-size='lg'] {
  inline-size: var(--space-xl);
  block-size: var(--space-xl);
}

.trusty-icon > * {
  inline-size: 100%;
  block-size: 100%;
}

.trusty-icon :deep(svg) {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}
</style>
