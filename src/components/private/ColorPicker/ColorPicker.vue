<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/color-area

import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
  ColorSwatch,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { computed } from 'vue'
import ColorChannelSlider from '../ColorChannelSlider/ColorChannelSlider.vue'

const props = defineProps<{
  /** A parseable hex colour, or `null` for none. */
  color: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  /** Hex, alpha byte kept. */
  pick: [value: string]
}>()

// Nothing commits until the user moves it.
const START = '#FF0000'
const SIDE_OFFSET_PX = 6

const current = computed(() => props.color ?? START)
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger
      :disabled="disabled"
      aria-label="Pick colour"
      class="color-picker-trigger"
    >
      <ColorSwatch
        :color="color ?? ''"
        aria-hidden="true"
        class="color-picker-swatch"
      />
    </PopoverTrigger>
    <PopoverPortal>
      <!-- as-child so the scoped data-v lands on the portalled panel. -->
      <PopoverContent
        align="start"
        :side-offset="SIDE_OFFSET_PX"
        :as-child="true"
      >
        <div
          class="color-picker-panel"
          :style="{ '--color-picker-opaque': current.slice(0, 7) }"
        >
          <ColorAreaRoot
            v-slot="{ style }"
            :model-value="current"
            color-space="hsb"
            x-channel="saturation"
            y-channel="brightness"
            @update:model-value="emit('pick', $event)"
          >
            <ColorAreaArea
              class="color-picker-area"
              :style="style"
            >
              <ColorAreaThumb class="color-picker-thumb" />
            </ColorAreaArea>
          </ColorAreaRoot>
          <ColorChannelSlider
            :color="current"
            channel="hue"
            @pick="emit('pick', $event)"
          />
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped>
.color-picker-trigger {
  display: flex;
  flex: none;
  padding: 0;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: var(--radius-xs);
}

.color-picker-trigger:disabled {
  cursor: not-allowed;
}

/* :focus paired with :hover for the a11y linter; pointer focus hides it again. */
.color-picker-trigger:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.color-picker-trigger:focus:not(:focus-visible) {
  outline-color: transparent;
}

.color-picker-trigger:hover:enabled .color-picker-swatch,
.color-picker-trigger[data-state='open'] .color-picker-swatch {
  border-color: var(--color-primary-highlight);
}

.color-picker-swatch {
  inline-size: var(--color-picker-swatch-size, var(--space-lg));
  block-size: var(--color-picker-swatch-size, var(--space-lg));
  background-color: var(--reka-color-swatch-color);
  border: var(--border-sm) solid var(--color-border);
  border-radius: var(--radius-xs);
}

/* No colour: a struck-through empty well. */
.color-picker-swatch[data-no-color] {
  background:
    linear-gradient(
      to bottom right,
      transparent calc(50% - var(--border-sm) / 2),
      var(--color-border) 0 calc(50% + var(--border-sm) / 2),
      transparent 0
    ),
    var(--color-bg);
}

.color-picker-panel {
  --shadow-color: var(--color-shadow);

  z-index: var(--layer-dropdown);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  inline-size: var(--size-2xs);
  padding: var(--space-sm);
  background-color: var(--color-bg-lowered);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  box-shadow:
    calc(-1 * var(--space-2xs)) calc(-1 * var(--space-2xs)) var(--shadow-sm) var(--shadow-color),
    var(--space-2xs) var(--space-2xs) var(--shadow-sm) var(--shadow-color);
  transform-origin: var(--reka-popover-content-transform-origin);
  animation: color-picker-in var(--duration-fast) ease-out;
}

.color-picker-area {
  position: relative;
  aspect-ratio: 4 / 3;
  cursor: crosshair;
  border-radius: var(--radius-xs);
}

.color-picker-thumb {
  inline-size: calc(var(--space-md) - 2 * var(--space-2xs));
  block-size: calc(var(--space-md) - 2 * var(--space-2xs));
  background-color: var(--color-picker-opaque);
  border-radius: var(--radius-full);
  box-shadow:
    0 0 0 var(--border-sm) var(--color-text),
    0 0 var(--space-xs) var(--color-shadow);
}

.color-picker-thumb:hover {
  cursor: grab;
}

.color-picker-thumb:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.color-picker-thumb:focus:not(:focus-visible) {
  outline-color: transparent;
}

@keyframes color-picker-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .color-picker-panel {
    animation: none;
  }
}
</style>
