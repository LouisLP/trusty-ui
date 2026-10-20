import type { ChartPlotConfig, TrustyChartSeries } from '../../../internal/chart/chart-data'
import type { ChartTheme } from '../../../internal/chart/chart-style'
import { chartAxis, chartOptions, chartValueGrid, withAlpha } from '../../../internal/chart/chart-style'

/** The opacity the un-hovered bars drop to, so the hovered one reads as the focus. */
export const MUTED_BAR_ALPHA = 0.4

/** The one bar under the pointer, or `null` when the pointer is off every bar. */
export interface ActiveBar {
  datasetIndex: number
  index: number
}

/**
 * The `backgroundColor` each dataset should carry given the hovered bar: a plain colour
 * for every dataset while nothing is hovered, and a per-bar array once one is — the hovered
 * bar keeps its colour, every other bar takes the muted one.
 */
export function barHoverBackgrounds(
  bases: string[],
  lengths: number[],
  active: ActiveBar | null,
): (string | string[])[] {
  return bases.map((base, dataset) => {
    if (!active)
      return base

    const muted = withAlpha(base, MUTED_BAR_ALPHA)
    return Array.from({ length: lengths[dataset] ?? 0 }, (_, index) =>
      dataset === active.datasetIndex && index === active.index ? base : muted)
  })
}

// Keyed by chart instance, so hover only repaints when the bar under the pointer changes
// (Chart.js fires `onHover` on every mousemove, and re-`update`ing each one would thrash).
const activeBarKeys = new WeakMap<object, string>()

export function buildBarPlot(
  spec: { categories: string[], series: TrustyChartSeries[], yAxisLabel?: string },
  theme: ChartTheme,
): ChartPlotConfig<'bar'> {
  const bases = spec.series.map((_, index) => theme.series[index % theme.series.length] ?? '')

  return {
    data: {
      labels: spec.categories,
      datasets: spec.series.map((item, index) => ({
        label: item.label,
        data: spec.categories.map((_, category) => item.values[category] ?? null),
        backgroundColor: bases[index],
        // Hovering must not recolour the bar — the muting of the others is the only cue.
        hoverBackgroundColor: bases[index],
        borderRadius: { topLeft: theme.radius, topRight: theme.radius, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
      })),
    },
    options: {
      ...chartOptions<'bar'>(),
      // Hovering a bar fades the rest to `MUTED_BAR_ALPHA`; leaving them restores the flat palette.
      onHover: (_event, elements, chart) => {
        const hit = elements[0]
        const active = hit ? { datasetIndex: hit.datasetIndex, index: hit.index } : null
        const key = active ? `${active.datasetIndex}:${active.index}` : ''
        if (activeBarKeys.get(chart) === key)
          return

        activeBarKeys.set(chart, key)
        const lengths = chart.data.datasets.map(dataset => dataset.data.length)
        const backgrounds = barHoverBackgrounds(bases, lengths, active)
        chart.data.datasets.forEach((dataset, index) => {
          dataset.backgroundColor = backgrounds[index]
        })
        chart.update('none')
      },
      datasets: {
        // Chart.js centres each bar in a `barThickness`-wide slot, so the surplus becomes the gap between them.
        bar: { barThickness: theme.barSize + theme.spaceXs, maxBarThickness: theme.barSize },
      },
      scales: {
        x: { ...chartAxis(theme), grid: { display: false } },
        y: { ...chartAxis(theme, spec.yAxisLabel), beginAtZero: true, grid: chartValueGrid(theme) },
      },
    },
  }
}
