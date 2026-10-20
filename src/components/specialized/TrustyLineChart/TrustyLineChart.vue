<script setup lang="ts">
import type { TrustyLineChartProps } from './TrustyLineChart.types'
import { computed } from 'vue'
import { CATEGORICAL_SERIES_COUNT, categoricalLegend, categoricalTable } from '../../../internal/chart/chart-categorical'
import ChartBase from '../../private/ChartBase/ChartBase.vue'
import { buildLinePlot } from './TrustyLineChart.config'

const props = withDefaults(defineProps<TrustyLineChartProps>(), {
  legend: true,
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
    plot="line"
    :title="title"
    :description="description"
    :series-count="CATEGORICAL_SERIES_COUNT"
    :spec="spec"
    :build="buildLinePlot"
    :legend="legendSections"
    :table="table"
  />
</template>
