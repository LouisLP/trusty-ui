<script setup lang="ts" generic="TKind extends PlotKind, TSpec">
// The chrome every plot shares; vue-chartjs paints the canvas (ADR 0003).

import type { ChartType, TooltipModel } from 'chart.js'
import type { ChartLegendItem } from '../../../internal/chart/chart-data'
import type { PlotKind } from '../../../internal/chart/chart-plots'
import type { ChartHover, ChartTheme } from '../../../internal/chart/chart-style'
import type { ChartBaseProps } from './ChartBase.types'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef, watch } from 'vue'
import { chartHoverFromTooltip, readChartTheme } from '../../../internal/chart/chart-style'
import TrustyHoverCard from '../../base/TrustyHoverCard/TrustyHoverCard.vue'

const props = defineProps<ChartBaseProps<TKind, TSpec>>()

const Plot = defineAsyncComponent(async () => {
  const { plots } = await import('../../../internal/chart/chart-plots')
  return plots[props.plot]
})

const titleId = useId()
const plot = useTemplateRef<HTMLElement>('plot')
const hover = ref<ChartHover | null>(null)

// A canvas cannot resolve var(), so tokens are read off the live element.
const theme = shallowRef<ChartTheme>()

// The webfont lands after first paint and Chart.js never re-measures its ticks.
const fontsLoaded = ref(false)

// The tokens are light-dark() pairs, resolved once into the canvas, so an OS theme switch has to re-read them.
const schemeChanges = ref(0)
const darkScheme = globalThis.matchMedia?.('(prefers-color-scheme: dark)')
function onSchemeChange() {
  schemeChanges.value++
}

onMounted(() => {
  document.fonts?.ready.then(() => {
    fontsLoaded.value = true
  })
  darkScheme?.addEventListener?.('change', onSchemeChange)
})

onBeforeUnmount(() => {
  darkScheme?.removeEventListener?.('change', onSchemeChange)
})

watch(
  () => [plot.value, props.seriesCount, props.themeKey, fontsLoaded.value, schemeChanges.value] as const,
  () => {
    if (plot.value)
      theme.value = readChartTheme(plot.value, props.seriesCount)
  },
  { flush: 'post' },
)

const config = computed(() => {
  if (!theme.value)
    return undefined
  const built = props.build(props.spec, theme.value)
  return {
    data: built.data,
    options: {
      ...built.options,
      plugins: {
        ...built.options?.plugins,
        // Merged, so a plot keeps its own tooltip options; TrustyHoverCard draws the card.
        tooltip: {
          ...built.options?.plugins?.tooltip,
          enabled: false,
          external: handleTooltip,
        },
      },
    },
  }
})

function handleTooltip(ctx: { tooltip: TooltipModel<ChartType> }) {
  hover.value = chartHoverFromTooltip(ctx.tooltip)
}

function swatch(item: ChartLegendItem) {
  return {
    backgroundColor: item.color,
    ...item.radius === undefined ? {} : { '--trusty-chart-swatch-size': `${item.radius * 2}px` },
  }
}
</script>

<template>
  <figure
    class="chart-base"
    :aria-labelledby="titleId"
  >
    <div class="chart-base-header">
      <!-- All three clip to one line; `title` keeps the full string recoverable. -->
      <h3
        :id="titleId"
        class="chart-base-title"
        :title="title"
      >
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="chart-base-description"
        :title="description"
      >
        {{ description }}
      </p>
    </div>

    <div class="chart-base-body">
      <div
        ref="plot"
        class="chart-base-plot"
      >
        <Plot
          v-if="config"
          :data="config.data"
          :options="config.options"
          aria-hidden="true"
        />
        <div
          v-if="hover"
          class="chart-base-hover-anchor"
          :style="{ left: `${hover.x}px`, top: `${hover.y}px` }"
        >
          <TrustyHoverCard
            :title="hover.title"
            :open="true"
            side="top"
          >
            <template #trigger>
              <span class="chart-base-hover-trigger" />
            </template>
            <div class="chart-base-legend-key">
              <span
                v-if="hover.color"
                class="chart-base-swatch"
                data-shape="box"
                :style="{ backgroundColor: hover.color }"
              />
              <span class="chart-base-legend-label">{{ hover.description || hover.title }}</span>
            </div>
          </TrustyHoverCard>
        </div>
      </div>

      <div
        v-if="legend?.length"
        class="chart-base-legend"
      >
        <div
          v-for="(section, index) in legend"
          :key="section.title ?? index"
        >
          <p
            v-if="section.title"
            class="chart-base-legend-title"
          >
            {{ section.title }}
          </p>
          <ul class="chart-base-legend-keys">
            <li
              v-for="item in section.items"
              :key="item.label"
              class="chart-base-legend-key"
            >
              <span
                class="chart-base-swatch"
                :data-shape="item.radius === undefined ? 'box' : 'dot'"
                :style="swatch(item)"
              />
              <span
                class="chart-base-legend-label"
                :title="item.label"
              >{{ item.label }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="chart-base-data">
      <table>
        <caption>
          {{ title }}
        </caption>
        <thead>
          <tr>
            <template
              v-for="(column, index) in table.columns"
              :key="index"
            >
              <!-- The corner cell labels nothing, and a blank <th> is an axe violation. -->
              <td v-if="!column" />
              <th
                v-else
                scope="col"
              >
                {{ column }}
              </th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in table.rows"
            :key="index"
          >
            <th scope="row">
              {{ row.header }}
            </th>
            <td
              v-for="(value, column) in row.values"
              :key="column"
            >
              {{ value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.chart-base {
  /* Default series palette, in order; a plot may override it. Component-level on purpose: only the charts draw series, so the colours live here, not in semantic.css. Five dentō-shoku dyes, ruri (lapis), moegi (young-shoot green), kariyasu (grass yellow), kurenai (safflower crimson) and fuji (wisteria): each clears 3:1 on --color-bg-elevated in its mode. They sit on the primitives' lightness ladder (600/500 light, 400/300 dark) but are spelled out, since a component may not name a primitive. readChartTheme resolves the light-dark() pair before Chart.js sees it. */
  --trusty-chart-series-1: light-dark(oklch(50.5% 0.141 254), oklch(68% 0.15 254));
  --trusty-chart-series-2: light-dark(oklch(50.5% 0.128 128), oklch(68% 0.14 128));
  --trusty-chart-series-3: light-dark(oklch(59% 0.118 97), oklch(78% 0.129 97));
  --trusty-chart-series-4: light-dark(oklch(50.5% 0.188 16), oklch(78% 0.126 16));
  --trusty-chart-series-5: light-dark(oklch(50.5% 0.113 290), oklch(78% 0.103 290));
  --trusty-chart-legend-width: 8rem;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  box-sizing: border-box;
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 16rem;

  /* A plot may ask for more width than its parent has — bars keep their thickness rather than
     overlapping — so the figure grows with it and a narrow parent scrolls. */
  min-inline-size: calc(
    var(--trusty-chart-plot-min-inline-size, 0px) + var(--trusty-chart-legend-gutter, 0px) + var(--space-md) * 2
  );
  padding: var(--space-md);
  margin: 0;
  font-family: var(--font-family-sans);
  color: var(--color-text);
  background-color: var(--trusty-chart-surface, var(--color-bg-elevated));
  border-radius: var(--radius-md);
}

.chart-base:has(.chart-base-legend) {
  --trusty-chart-legend-gutter: calc(var(--trusty-chart-legend-width) + var(--space-lg));
}

.chart-base-header {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  overflow: hidden;
}

.chart-base-title {
  margin: 0;
  overflow: hidden;
  font-family: var(--font-family-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-base-description {
  margin: 0;
  overflow: hidden;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-base-body {
  display: flex;
  flex: 1 1 auto;
  gap: var(--space-lg);
  min-block-size: 12rem;
}

/* A bar plot sets the min width its bars need, so a narrow parent scrolls instead of overlapping them. */
.chart-base-plot {
  position: relative;
  flex: 1 1 auto;
  min-inline-size: var(--trusty-chart-plot-min-inline-size, 0);
}

.chart-base-plot canvas {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

/* Chart.js caret is canvas pixels from the plot's top-left. The trigger is a point, not a hit target. */
.chart-base-hover-anchor {
  position: absolute;
  inline-size: 0;
  block-size: 0;
  pointer-events: none;
}

.chart-base-hover-trigger {
  display: block;
  inline-size: 1px;
  block-size: 1px;
}

.chart-base-legend {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  gap: var(--space-md);
  align-self: center;
  max-inline-size: var(--trusty-chart-legend-width);
}

.chart-base-legend-title {
  margin: 0 0 var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
}

.chart-base-legend-keys {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: 0;
  margin: 0;
  list-style: none;
}

.chart-base-legend-key {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  min-inline-size: 0;
}

.chart-base-swatch {
  flex-shrink: 0;
  background-color: var(--color-text-muted);
}

.chart-base-swatch[data-shape='box'] {
  inline-size: 1.125rem;
  block-size: 0.75rem;
  border-radius: var(--radius-xs);
}

.chart-base-swatch[data-shape='dot'] {
  inline-size: var(--trusty-chart-swatch-size);
  block-size: var(--trusty-chart-swatch-size);
  border-radius: var(--radius-full);
}

.chart-base-legend-label {
  overflow: hidden;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Visually hidden: the canvas is aria-hidden, so this table is the accessible copy.
   Clip the wrapper (a block), never the table — Firefox paints <caption> outside a table's
   overflow/clip-path, which is the second "Title" in the header. */
.chart-base-data {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}
</style>
