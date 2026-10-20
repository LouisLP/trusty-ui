<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/stepper

import type { TrustyIconName } from '../../../icons'
import {
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperRoot,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustyStepperOrientation = 'horizontal' | 'vertical'

const props = withDefaults(defineProps<{
  /**
   * The steps, in order. Their position is their number — step 1 is the first entry — which is what `v-model` reports. Each step:
   * - `title`: the step's name; its accessible name is "Step <n>: <title>"
   * - `description`: second line under the title
   * - `icon`: icon name (Iconify `collection:icon`, e.g. `ph:gear`) shown in place of the number
   * - `disabled`: this step can never be reached, whatever the progress
   * - `warning`: yellow dot on the indicator — something here needs attention
   */
  steps: {
    title: string
    description?: string
    icon?: TrustyIconName
    disabled?: boolean
    warning?: boolean
  }[]
  orientation?: TrustyStepperOrientation
  /** Sequential progress: only steps already reached, plus the one straight after, can be picked. Turn it off to let every step be picked at any time. */
  linear?: boolean
}>(), {
  orientation: 'horizontal',
  linear: true,
})

// The current step, 1-based. Uncontrolled starts at the first step.
const model = defineModel<number>()
</script>

<template>
  <StepperRoot
    v-model="model"
    :default-value="1"
    :orientation="props.orientation"
    :linear="props.linear"
    class="trusty-stepper"
  >
    <StepperItem
      v-for="(step, index) in props.steps"
      :key="index"
      :step="index + 1"
      :disabled="step.disabled || undefined"
      class="trusty-stepper-item"
    >
      <StepperTrigger class="trusty-stepper-trigger">
        <StepperIndicator class="trusty-stepper-indicator">
          <TrustyIcon
            v-if="step.icon"
            :name="step.icon"
            class="trusty-stepper-icon"
          />
          <template v-else>
            {{ index + 1 }}
          </template>
          <span
            v-if="step.warning"
            class="trusty-stepper-warning"
          />
        </StepperIndicator>
      </StepperTrigger>

      <!-- Not inside the trigger: the trigger is the circle, and Reka wires the title/description to it through aria-labelledby/describedby anyway. -->
      <div class="trusty-stepper-text">
        <!-- The title is the trigger's accessible name, but the trigger shows the step number; the hidden prefix puts that number in the name too (WCAG 2.5.3, label in name), so "click 2" in voice control finds it. -->
        <StepperTitle class="trusty-stepper-title">
          <span class="trusty-stepper-sr">Step {{ index + 1 }}:</span> {{ step.title }}
        </StepperTitle>
        <StepperDescription
          v-if="step.description"
          class="trusty-stepper-description"
        >
          {{ step.description }}
        </StepperDescription>
      </div>

      <StepperSeparator
        v-if="index < props.steps.length - 1"
        class="trusty-stepper-separator"
      />
    </StepperItem>
  </StepperRoot>
</template>

<style scoped>
/* Read by assistive tech, drawn nowhere. Not Reka's VisuallyHidden: that one sets aria-hidden="true" by default, which hides the text from the very readers it is for. */
.trusty-stepper-sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}
.trusty-stepper {
  display: grid;
  font-family: var(--font-family-sans);
}

/* Equal columns, so every step gets the same width and the connectors between two circles are the same length wherever the labels differ in size. */
.trusty-stepper[data-orientation='horizontal'] {
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
}

.trusty-stepper-item {
  position: relative;
}

.trusty-stepper[data-orientation='horizontal'] .trusty-stepper-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  align-items: center;
}

/* Indicator column, then text; the run below the indicator carries the connector down to the next step. */
.trusty-stepper[data-orientation='vertical'] .trusty-stepper-item {
  display: grid;
  grid-template-columns: var(--size-control-md) 1fr;
  column-gap: var(--space-sm);
  align-items: center;
}

.trusty-stepper[data-orientation='vertical'] .trusty-stepper-item:not(:last-child) {
  padding-block-end: var(--space-lg);
}

.trusty-stepper-trigger {
  display: flex;
  padding: 0;
  appearance: none;
  cursor: pointer;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-full);
}

/* Keyboard focus ring, hidden for pointer focus. */
.trusty-stepper-trigger:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--border-sm);
}

.trusty-stepper-trigger:focus:not(:focus-visible) {
  outline-color: transparent;
}

.trusty-stepper-indicator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--size-control-md);
  block-size: var(--size-control-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-snug);
  color: var(--color-text);
  background-color: var(--color-bg-accented);
  border-radius: var(--radius-full);
  transition: background-color var(--duration-fast) ease-out;
}

/* Ground covered — the step the user is on, and every step behind it — carries the primary fill, so the filled run reads as progress. The step ahead keeps the plain fill: reachable, not yet done. */
.trusty-stepper-trigger[data-state='active'] .trusty-stepper-indicator,
.trusty-stepper-trigger[data-state='completed'] .trusty-stepper-indicator {
  color: var(--color-on-primary);
  background-color: var(--color-primary);
}

/* Out of reach — a disabled step, or one linear progress hasn't unlocked. Disabled reads through colour, not opacity (matches TrustyButton). */
.trusty-stepper-trigger[data-disabled] {
  cursor: not-allowed;
}

.trusty-stepper-trigger[data-disabled] .trusty-stepper-indicator {
  color: var(--color-text-muted);
  background-color: var(--color-secondary-muted);
}

/* Sized at 1em by TrustyIcon, so it takes the indicator's own scale. */
.trusty-stepper-icon {
  font-size: var(--font-size-xl);
}

/* Attention marker, tucked into the indicator's top corner. */
.trusty-stepper-warning {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  inline-size: var(--space-sm);
  block-size: var(--space-sm);
  background-color: var(--color-warning-text);
  border-radius: var(--radius-full);
}

.trusty-stepper-text {
  display: flex;
  flex-direction: column;
}

.trusty-stepper[data-orientation='horizontal'] .trusty-stepper-text {
  align-items: center;
  text-align: center;
}

.trusty-stepper-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  color: var(--color-text);
}

/* The vertical rail is a sidebar rather than a header, so its titles sit at the description's size. */
.trusty-stepper[data-orientation='vertical'] .trusty-stepper-title {
  font-size: var(--font-size-xs);
}

.trusty-stepper-description {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
}

/* Connectors are positioned off the indicator rather than laid out in flow, so a two-line label never drags the line off the circles' centre line. */
.trusty-stepper-separator {
  position: absolute;
  background-color: var(--color-border);
}

.trusty-stepper[data-orientation='horizontal'] .trusty-stepper-separator {
  inset-block-start: calc(var(--size-control-md) / 2);
  inset-inline-start: calc(50% + var(--size-control-md) / 2 + var(--space-xs));
  inline-size: calc(100% - var(--size-control-md) - var(--space-sm));
  block-size: var(--border-md);
  translate: 0 -50%;
}

.trusty-stepper[data-orientation='vertical'] .trusty-stepper-separator {
  inset-block-start: calc(var(--size-control-md) + var(--space-xs));
  inset-inline-start: calc(var(--size-control-md) / 2);
  inline-size: var(--border-md);
  block-size: calc(100% - var(--size-control-md) - var(--space-sm));
  translate: -50% 0;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-stepper-indicator {
    transition: none;
  }
}
</style>
