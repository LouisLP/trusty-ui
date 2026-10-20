// The data vocabulary every plot shares, across the specialized/private boundary.

import type { ChartData, ChartOptions, ChartType } from 'chart.js'

/** One named series of a categorical plot — `<TrustyBarChart>` and `<TrustyLineChart>` share it. */
export interface TrustyChartSeries {
  /** Legend and tooltip name. */
  label: string
  /** One per category, in order. A short array or `null` is a gap — never a zero. */
  values: (number | null)[]
}

/** What a plot hands Chart.js, typed to its own plot type. `ChartBase` only forwards it. */
export interface ChartPlotConfig<TType extends ChartType = ChartType> {
  data: ChartData<TType>
  options: ChartOptions<TType>
}

/** One legend key: a colour swatch, or a dot sized by `radius` for a size encoding. */
export interface ChartLegendItem {
  label: string
  color?: string
  radius?: number
}

/** A titled block of legend keys. A plot may stack more than one. */
export interface ChartLegendSection {
  title?: string
  items: ChartLegendItem[]
}

/** The numbers as a table, for the assistive tech a canvas gives nothing to navigate. */
export interface ChartDataTable {
  /** Column headers. The first names the row-header column and is usually empty. */
  columns: string[]
  /** A `null` renders as an empty cell. */
  rows: { header: string, values: (string | number | null)[] }[]
}
