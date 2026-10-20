import type { ChartPlotConfig, TrustyChartSeries } from '../../../internal/chart/chart-data'
import type { ChartTheme } from '../../../internal/chart/chart-style'
import { chartAxis, chartOptions, chartValueGrid } from '../../../internal/chart/chart-style'

export function buildLinePlot(
  spec: { categories: string[], series: TrustyChartSeries[], yAxisLabel?: string },
  theme: ChartTheme,
): ChartPlotConfig<'line'> {
  return {
    data: {
      labels: spec.categories,
      datasets: spec.series.map((item, index) => {
        const color = theme.series[index % theme.series.length]
        return {
          label: item.label,
          data: spec.categories.map((_, category) => item.values[category] ?? null),
          borderColor: color,
          backgroundColor: color,
          // Hovering must not recolour the line or its points — keep every hover colour on its base.
          hoverBorderColor: color,
          hoverBackgroundColor: color,
          borderWidth: theme.borderWidth,
          pointBackgroundColor: color,
          pointBorderColor: theme.surface,
          pointBorderWidth: theme.borderWidth,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: theme.surface,
          pointRadius: theme.spaceXs,
          pointHoverRadius: theme.spaceSm,
          tension: 0.3,
        }
      }),
    },
    options: {
      ...chartOptions<'line'>(),
      scales: {
        x: { ...chartAxis(theme), grid: { color: theme.border } },
        y: { ...chartAxis(theme, spec.yAxisLabel), beginAtZero: true, grid: chartValueGrid(theme) },
      },
    },
  }
}
