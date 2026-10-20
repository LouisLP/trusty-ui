import type { TrustyChartSeries } from '../../../internal/chart/chart-data'

export interface TrustyLineChartProps {
  /** Heading above the plot. Names the figure for assistive tech. */
  title: string
  /** One line of prose under the heading. */
  description?: string
  /** Rotated label along the y-axis. */
  yAxisLabel?: string
  /** Category names along the x-axis, left to right. No upper bound. */
  categories: string[]
  /** Up to five series, one polyline each. */
  series: TrustyChartSeries[]
  /** Legend right of the plot. On by default, hidden for a single series. */
  legend?: boolean
}
