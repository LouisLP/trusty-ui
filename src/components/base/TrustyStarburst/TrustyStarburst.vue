<script setup lang="ts">
type Line = [x1: number, y1: number, x2: number, y2: number]

interface RaySet {
  viewBox: string
  /** Three hand-jittered redraws of the same rays; the boil cycles them. */
  frames: [Line[], Line[], Line[]]
}

type TrustyStarburstVariant = 'stamp' | 'burst' | 'spark'

withDefaults(defineProps<{
  /** stamp: a half-arc radiating up, over a badge. burst: large loose rays shooting left off an edge. spark: four ticks fanning up-right beside a heading. */
  variant?: TrustyStarburstVariant
}>(), {
  variant: 'stamp',
})

/* Lines are ordered top-to-bottom / left-to-right within each frame, so the odd/even colour alternation lands on the same ray in every redraw. */
const VARIANTS: Record<TrustyStarburstVariant, RaySet> = {
  stamp: {
    viewBox: '0 0 120 40',
    frames: [
      [
        [31, 36.2, 25.2, 34.7],
        [37, 24.7, 27.8, 17],
        [47.3, 16.8, 44.8, 11.4],
        [60, 14, 60, 2],
        [72.7, 16.8, 75.2, 11.4],
        [83, 24.7, 92.2, 17],
        [89, 36.2, 94.8, 34.7],
      ],
      [
        [31.4, 35.6, 24.6, 33.9],
        [36.6, 25.3, 28.6, 18.1],
        [47, 17.4, 44.1, 10.8],
        [60.4, 13.6, 60.2, 3],
        [73.1, 16.3, 76, 10.9],
        [83.4, 24.2, 91.5, 16.3],
        [88.6, 36.6, 95.5, 35.2],
      ],
      [
        [30.6, 36.7, 25.7, 35.4],
        [37.4, 24.2, 27.2, 16.4],
        [47.7, 16.3, 45.4, 12],
        [59.6, 14.3, 59.8, 1.4],
        [72.3, 17.2, 74.6, 11.9],
        [82.6, 25.1, 92.8, 17.7],
        [89.3, 35.8, 94.2, 34.1],
      ],
    ],
  },
  /* Irregular angles, lengths and spacing on purpose. Mirror with `scale: -1 1` to shoot right. */
  burst: {
    viewBox: '0 0 100 240',
    frames: [
      [
        [92, 30, 55, 12],
        [88, 70, 30, 58],
        [94, 105, 10, 100],
        [90, 140, 38, 152],
        [93, 185, 60, 200],
        [85, 218, 68, 226],
      ],
      [
        [91, 31.5, 52, 10],
        [88.5, 68, 33, 57],
        [93, 106.5, 14, 103],
        [90.5, 141.5, 35, 151],
        [92, 183.5, 57, 197],
        [85.5, 216, 66, 223],
      ],
      [
        [93, 29, 57, 14.5],
        [87.5, 71.5, 28, 60],
        [94.5, 103.5, 7, 98],
        [89.5, 138.5, 41, 154],
        [93.5, 186.5, 62, 203],
        [84.5, 219.5, 70, 228],
      ],
    ],
  },
  /* Fans from an implied origin at the bottom left. Mirror with `scale: -1 1` to fan up-left. */
  spark: {
    viewBox: '0 0 60 60',
    frames: [
      [
        [7, 36, 5, 16],
        [13, 33, 17, 24],
        [20, 39, 28, 27],
        [27, 47, 48, 39],
      ],
      [
        [7.8, 35, 6, 14.5],
        [12.4, 33.8, 16, 25.2],
        [20.6, 38, 29.5, 26.2],
        [26.5, 47.8, 46.5, 40.2],
      ],
      [
        [6.4, 36.8, 4.2, 17.6],
        [13.6, 32.4, 18, 23.2],
        [19.4, 40, 27, 28],
        [27.8, 46.2, 49.2, 38.2],
      ],
    ],
  },
}
</script>

<template>
  <!-- Three hand-jittered frames swap on a stepped cycle — a cel-animation "line boil", so the mark reads as drawn rather than rendered. Size and orientation are the consumer's (inline-size, rotate, scale on the root). -->
  <svg
    class="trusty-starburst"
    :data-variant="variant"
    :viewBox="VARIANTS[variant].viewBox"
    aria-hidden="true"
  >
    <g
      v-for="(frame, i) in VARIANTS[variant].frames"
      :key="i"
      class="trusty-starburst-frame"
    >
      <line
        v-for="([x1, y1, x2, y2], j) in frame"
        :key="j"
        :x1
        :y1
        :x2
        :y2
      />
    </g>
  </svg>
</template>

<style scoped>
/* stroke-width is in viewBox units, so it scales with the mark like an icon's path data. */
.trusty-starburst {
  display: block;
  stroke-linecap: round;
  stroke-width: 3;
}

.trusty-starburst line:nth-child(odd) {
  stroke: var(--color-secondary-highlight);
}

.trusty-starburst line:nth-child(even) {
  stroke: var(--color-primary);
}

/* One frame at a time; each holds for a third of the cycle. */
.trusty-starburst-frame {
  visibility: hidden;
  animation: trusty-starburst-boil var(--duration-boil) steps(1) infinite;
}

.trusty-starburst-frame:nth-child(2) {
  animation-delay: calc(var(--duration-boil) / 3);
}

.trusty-starburst-frame:nth-child(3) {
  animation-delay: calc(var(--duration-boil) * 2 / 3);
}

@keyframes trusty-starburst-boil {
  0% {
    visibility: visible;
  }

  33.33% {
    visibility: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .trusty-starburst-frame {
    animation: none;
  }

  .trusty-starburst-frame:first-child {
    visibility: visible;
  }
}
</style>
