<script setup lang="ts">
import type { TrustyBarChartProps } from './TrustyBarChart.types'
import { computed } from 'vue'
import { CATEGORICAL_SERIES_COUNT, categoricalLegend, categoricalTable } from '../../../internal/chart/chart-categorical'
import ChartBase from '../../private/ChartBase/ChartBase.vue'
import { buildBarPlot } from './TrustyBarChart.config'

const props = withDefaults(defineProps<TrustyBarChartProps>(), {
  legend: true,
  size: 'md',
})

// Memoised: ChartBase watches `spec` by identity, so a literal would rebuild every render.
const spec = computed(() => ({
  categories: props.categories,
  series: props.series,
  yAxisLabel: props.yAxisLabel,
}))
const legendSections = computed(() => categoricalLegend(props.series, props.legend))
const table = computed(() => categoricalTable(props.categories, props.series))
</script>

<template>
  <ChartBase
    plot="bar"
    class="trusty-bar-chart"
    :data-size="size"
    :theme-key="size"
    :title="title"
    :description="description"
    :series-count="CATEGORICAL_SERIES_COUNT"
    :spec="spec"
    :build="buildBarPlot"
    :legend="legendSections"
    :table="table"
    :style="{
      '--trusty-chart-categories': categories.length,
      '--trusty-chart-series-count': series.length,
    }"
  />
</template>

<style scoped>
/* Bars keep their thickness, so the plot claims the width its clusters need. 4rem is the y-axis. */
.trusty-bar-chart {
  --trusty-chart-plot-min-inline-size: calc(
    var(--trusty-chart-categories) *
      (var(--trusty-chart-series-count) * (var(--trusty-chart-bar-size) + var(--space-xs)) + var(--space-sm)) + 4rem
  );
}

.trusty-bar-chart[data-size='md'] {
  --trusty-chart-bar-size: var(--size-control-md);
}

.trusty-bar-chart[data-size='sm'] {
  --trusty-chart-bar-size: var(--size-control-sm);
}

.trusty-bar-chart[data-size='xs'] {
  --trusty-chart-bar-size: var(--size-control-xs);
}
</style>
