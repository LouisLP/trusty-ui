/**
 * The lazy half of a plot: vue-chartjs's typed components, plus the Chart.js elements and
 * scales their controllers need. ChartBase reaches this module through `defineAsyncComponent`,
 * so Chart.js ships as its own chunk (ADR 0003) — never import it from a statically loaded file.
 */

import type { ChartType } from 'chart.js'
import type { Component } from 'vue'
import {
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'

Chart.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip)

/** Narrowed out of Chart.js's `ChartType`, so `plot` fixes the config type a plot must build. */
export type PlotKind = Extract<ChartType, 'bar' | 'line'>

/** vue-chartjs registers each controller itself. */
export const plots: Record<PlotKind, Component> = { bar: Bar, line: Line }
