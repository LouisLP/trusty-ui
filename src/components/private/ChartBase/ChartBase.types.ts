import type { ChartDataTable, ChartLegendSection, ChartPlotConfig } from '../../../internal/chart/chart-data'
import type { PlotKind } from '../../../internal/chart/chart-plots'
import type { ChartTheme } from '../../../internal/chart/chart-style'

export interface ChartBaseProps<TKind extends PlotKind, TSpec> {
  /** Which Chart.js plot to mount. Fixes the type `build` must return. */
  plot: TKind
  /** Heading above the plot. Names the figure for assistive tech. */
  title: string
  /** One line of prose under the heading. */
  description?: string
  /** How many `--trusty-chart-series-*` the plot's own palette defines. */
  seriesCount: number
  /** The plot's own data. Watched by identity, so pass a `computed`, never a literal. */
  spec: TSpec
  /** Spec plus tokens to a Chart.js config. Must be a stable module-level reference. */
  build: (spec: TSpec, theme: ChartTheme) => ChartPlotConfig<TKind>
  /** Changed by the wrapper when its own custom properties do, to re-read the tokens. */
  themeKey?: string | number
  /** Legend blocks right of the plot. Omitted or empty hides the column. */
  legend?: ChartLegendSection[]
  table: ChartDataTable
}
