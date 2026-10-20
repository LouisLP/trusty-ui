<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/tooltip#tooltip

import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
import { watchEffect } from 'vue'
import { TOOLTIP_TEXT_MAX } from './TrustyTooltip.constants'

type TrustyTooltipSide = 'top' | 'right' | 'bottom' | 'left'
type TrustyTooltipAlignment = 'start' | 'center' | 'end'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Tooltip text. Plain string only: keeps every tooltip on the design system */
  text: string
  /** Which edge of the trigger the tooltip is anchored to */
  side?: TrustyTooltipSide
  /** How the tooltip is aligned relative to the trigger */
  alignment?: TrustyTooltipAlignment
  /** Disable the tooltip entirely (trigger still renders) */
  disabled?: boolean
}>(), {
  side: 'top',
  alignment: 'center',
  disabled: false,
})

const OPEN_DELAY_MS = 300

if (import.meta.env.DEV) {
  watchEffect(() => {
    if (props.text.length > TOOLTIP_TEXT_MAX) {
      console.warn(
        `[TrustyTooltip] "text" is ${props.text.length} characters (max ${TOOLTIP_TEXT_MAX}). `
        + `Tooltips are short hints, not descriptions — shorten the text or use a different component for longer content.`,
      )
    }
  })
}
</script>

<template>
  <TooltipProvider :delay-duration="OPEN_DELAY_MS">
    <TooltipRoot :disabled="disabled">
      <TooltipTrigger
        v-bind="$attrs"
        :as-child="true"
      >
        <slot />
      </TooltipTrigger>

      <TooltipPortal>
        <!-- as-child: render our own element as the tooltip so Vue's scoped data-v attribute lands on it (and on TooltipArrow's root), letting plain scoped selectors style the portalled tooltip. -->
        <TooltipContent
          :align="alignment"
          :side="side"
          :side-offset="6"
          :as-child="true"
        >
          <div class="trusty-tooltip">
            {{ text }}
          </div>
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped>
.trusty-tooltip {
  z-index: var(--layer-tooltip);
  max-inline-size: var(--size-xs);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
  overflow-wrap: break-word;
  background-color: var(--color-bg-accented);
  border-radius: var(--radius-xs);
  box-shadow: 0 var(--space-2xs) var(--space-sm) var(--color-shadow);
  transform-origin: var(--reka-tooltip-content-transform-origin);
  animation: trusty-tooltip-in var(--duration-fast) ease-out;
}

@keyframes trusty-tooltip-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-tooltip {
    animation: none;
  }
}
</style>
