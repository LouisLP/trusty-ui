<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/color-slider

import type { Color } from 'reka-ui'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack, SliderTrack } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<{
  /** A parseable hex colour. */
  color: string
  channel: 'alpha' | 'hue'
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** Hex, alpha byte included below full opacity. */
  pick: [value: string]
}>()

const opaque = computed(() => props.color.slice(0, 7))

function onUpdate(value: string | Color) {
  if (typeof value === 'string')
    emit('pick', value)
}
</script>

<template>
  <ColorSliderRoot
    :model-value="color"
    :channel="channel"
    :color-space="channel === 'hue' ? 'hsb' : undefined"
    :disabled="disabled"
    :data-channel="channel"
    class="color-channel-slider"
    :style="{ '--color-channel-slider-opaque': opaque }"
    @update:model-value="onUpdate"
  >
    <!-- ColorSliderTrack's alpha checkerboard is too loud; ours sits on the root. -->
    <SliderTrack
      v-if="channel === 'alpha'"
      class="color-channel-slider-track"
    />
    <ColorSliderTrack
      v-else
      class="color-channel-slider-track"
    />
    <ColorSliderThumb class="color-channel-slider-thumb" />
  </ColorSliderRoot>
</template>

<style scoped>
.color-channel-slider {
  position: relative;
  display: flex;
  align-items: center;
  min-inline-size: 0;
  block-size: var(--space-md);
  touch-action: none;
  cursor: pointer;
  user-select: none;
  border: var(--border-sm) solid var(--color-border);
  border-radius: var(--radius-xs);
}

.color-channel-slider[data-channel='alpha'] {
  --color-channel-slider-check: color-mix(in oklab, var(--color-text) 10%, transparent);

  background-image: repeating-conic-gradient(var(--color-channel-slider-check) 0 25%, transparent 0 50%);
  background-size: var(--space-sm) var(--space-sm);
}

.color-channel-slider[data-disabled] {
  cursor: not-allowed;
  opacity: 0.45;
}

.color-channel-slider-track {
  position: relative;
  flex-grow: 1;
  block-size: 100%;
  border-radius: var(--radius-xs);
}

.color-channel-slider[data-channel='alpha'] .color-channel-slider-track {
  background-image: linear-gradient(to right, transparent, var(--color-channel-slider-opaque));
}

.color-channel-slider-thumb {
  display: block;
  inline-size: calc(var(--space-md) - 2 * var(--space-2xs));
  block-size: calc(var(--space-md) - 2 * var(--space-2xs));
  background-color: var(--color-channel-slider-opaque);
  border-radius: var(--radius-full);
  box-shadow:
    0 0 0 var(--border-sm) var(--color-text),
    0 0 var(--space-xs) var(--color-shadow);
}

.color-channel-slider-thumb:hover {
  cursor: grab;
}

.color-channel-slider-thumb:active {
  cursor: grabbing;
}

/* :focus paired with :hover for the a11y linter; pointer focus hides it again. */
.color-channel-slider-thumb:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.color-channel-slider-thumb:focus:not(:focus-visible) {
  outline-color: transparent;
}
</style>
