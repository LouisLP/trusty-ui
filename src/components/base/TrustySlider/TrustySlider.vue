<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/slider

import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { computed, useAttrs } from 'vue'

// A layer-1 control: fall-through attrs (`aria-label`, `id`, `aria-describedby`, …) must reach the FOCUSABLE element — the thumb — or the slider has no accessible name. A range slider has two thumbs, which Reka already names "Minimum" and "Maximum", so there they label the wrapper as a group instead.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Shows the current value to the right of the track. Single-thumb sliders only. */
  showValue?: boolean
}>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showValue: true,
})

// Value(s). One entry per thumb — a two-entry array renders a range slider.
const model = defineModel<number[]>({ default: () => [50] })

// Reserve enough width for the widest possible reading (min or max) so the track doesn't shrink/grow
const attrs = useAttrs()
const forwarded = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
const isRange = computed(() => model.value.length > 1)

const valueWidth = computed(() => `${Math.max(String(props.min).length, String(props.max).length)}ch`)
</script>

<template>
  <div
    class="trusty-slider-wrapper"
    :class="attrs.class"
    :style="attrs.style"
    :role="isRange ? 'group' : undefined"
    v-bind="isRange ? forwarded : {}"
  >
    <SliderRoot
      v-model="model"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      class="trusty-slider"
    >
      <SliderTrack class="trusty-slider-track">
        <SliderRange class="trusty-slider-range" />
      </SliderTrack>
      <SliderThumb
        v-for="(_, i) in model"
        :key="i"
        class="trusty-slider-thumb"
        v-bind="isRange ? {} : forwarded"
      />
    </SliderRoot>
    <span
      v-if="showValue && model.length === 1"
      class="trusty-slider-value"
      :style="{ inlineSize: valueWidth }"
    >{{ model[0] }}</span>
  </div>
</template>

<style scoped>
.trusty-slider-wrapper {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  inline-size: 100%;
}

.trusty-slider-value {
  flex-shrink: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-normal);
  color: var(--color-text);
  text-align: end;
}

.trusty-slider-wrapper:has(.trusty-slider[data-disabled]) .trusty-slider-value {
  color: var(--color-text-muted);
}

.trusty-slider {
  position: relative;
  display: flex;
  flex-grow: 1;
  align-items: center;
  min-inline-size: 0;
  block-size: var(--space-md);

  /* Prevents the browser from stealing the drag as a scroll/pan gesture on touch. Flagged against stale Safari data, but it's broadly supported. */
  /* stylelint-disable-next-line plugin/no-unsupported-browser-features */
  touch-action: none;
  cursor: pointer;
  user-select: none;
}

.trusty-slider[data-disabled] {
  cursor: not-allowed;
  opacity: 0.45;
}

.trusty-slider-track {
  position: relative;
  flex-grow: 1;
  block-size: var(--space-2xs);
  background-color: var(--color-text-muted);
  border-radius: var(--radius-full);
}

.trusty-slider-range {
  position: absolute;
  inset-block-start: 50%;
  block-size: var(--space-xs);
  background-color: var(--color-text-toned);
  border-radius: var(--radius-full);
  translate: 0 -50%;
}

.trusty-slider-thumb {
  display: block;
  inline-size: var(--space-md);
  block-size: var(--space-md);
  background-color: var(--color-text-toned);
  border-radius: var(--radius-full);
  transition:
    background-color var(--duration-fast) ease-out,
    box-shadow var(--duration-fast) ease-out;
}

.trusty-slider-thumb:hover {
  cursor: grab;
  background-color: var(--color-text-toned);
  box-shadow: 0 0 0 var(--space-2xs) var(--color-primary);
}

.trusty-slider-thumb:active {
  cursor: grabbing;
}

.trusty-slider:has(.trusty-slider-thumb:active) {
  cursor: grabbing;
}

.trusty-slider[data-disabled] .trusty-slider-thumb {
  cursor: not-allowed;
}

/* Authored on :focus so the a11y linter sees it paired with :hover, then hidden for pointer focus — only keyboard users get the ring. */
.trusty-slider-thumb:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
  background-color: var(--color-text-toned);
}

.trusty-slider-thumb:focus:not(:focus-visible) {
  outline-color: transparent;
  background-color: var(--color-text-toned);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-slider-thumb {
    transition: none;
  }
}
</style>
