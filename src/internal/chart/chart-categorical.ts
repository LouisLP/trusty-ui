import type { ChartDataTable, ChartLegendSection, TrustyChartSeries } from './chart-data'

/** Colours in the default palette — see `ChartBase.vue`. */
export const CATEGORICAL_SERIES_COUNT = 5

/** A single legend block, empty for one series: its name is already the heading. */
export function categoricalLegend(series: TrustyChartSeries[], show: boolean): ChartLegendSection[] {
  if (import.meta.env.DEV && series.length > CATEGORICAL_SERIES_COUNT) {
    console.warn(
      `[trusty-ui] A chart was given ${series.length} series but the palette has `
      + `${CATEGORICAL_SERIES_COUNT} colours, so they will repeat. Split the data across charts.`,
    )
  }

  if (!show || series.length < 2)
    return []

  return [{
    items: series.map((item, index) => ({
      label: item.label,
      color: `var(--trusty-chart-series-${(index % CATEGORICAL_SERIES_COUNT) + 1})`,
    })),
  }]
}

/** Series down the rows, categories across the columns. */
export function categoricalTable(categories: string[], series: TrustyChartSeries[]): ChartDataTable {
  return {
    columns: ['', ...categories],
    rows: series.map(item => ({
      header: item.label,
      values: categories.map((_, category) => item.values[category] ?? null),
    })),
  }
}
