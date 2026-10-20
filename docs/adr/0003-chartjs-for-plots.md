# ADR 0003 — Chart.js for plots

**Status:** accepted, 2026-09-10
**Affects:** `TrustyBarChart`, `TrustyLineChart`, the
dependency surface in [README.md](../../README.md#the-rules) and
[CONTEXT.md](../../CONTEXT.md#architecture-decisions)

## Context

Plots have to match the Figma chrome — axes, grid, legend, tooltip — without
hand-drawing every scale. Hand-rolled HTML/SVG was the alternative: no new
dependency, but every plot type reimplements scales, ticks, and hover, and the
axes and the plot become two sources of truth.

## Decision

Depend on **Chart.js 4** through **`vue-chartjs`**, its own typed Vue wrapper,
which owns the canvas lifecycle (mount, reactive data and options, destroy) that
would otherwise be ours to write and test.

Both are loaded by **dynamic import**, the lazy-chunk rule
[ADR 0001](./0001-codemirror-for-code-editing.md) uses for CodeMirror: a
consumer that never mounts a chart never ships Chart.js.

One private base, one public component per plot type:

- **`ChartBase`** — the shared chrome: the panel, the heading, the HTML legend,
  the TrustyHoverCard on a hovered point, the visually hidden data table, and the
  lazily mounted `vue-chartjs` plot. It takes the Chart.js configuration as a
  `build` callback.
- **`TrustyBarChart`**, **`TrustyLineChart`** — categories and series values, the
  same data model (`TrustyChartSeries`).

A plot type is a component, not a `type` prop: each one has its own props, its
own palette, and its own Storybook page, and a new one (doughnut, area) is a new
wrapper over the same base.

Only the elements and scales the plots draw are registered — not
`Chart.register(...registerables)`; `vue-chartjs` registers each controller.

Canvas cannot resolve `var(--token)`, so `ChartBase` reads computed styles off
the plot element and hands Chart.js real values. Series colours are
`--trusty-chart-series-*`, defined by the component rather than as semantic
tokens: nothing outside a chart has any use for them.

## Consequences

- The dependency surface grows by `chart.js` and `vue-chartjs`. README and
  CONTEXT.md list them next to CodeMirror, with the same "dynamic import, own
  chunk" caveat.
- Chart.js paints its own canvas, which never carries Vue's scope attribute, so
  scoped CSS cannot restyle ticks. The options carry the token values instead.
  Anything that can be HTML — legend, heading, hover card, data table — stays HTML.
- Unit tests stub the plot module (jsdom has no canvas context). They cover the
  chrome, the legend, the table, and the Vue-free configuration builders.
  Geometry is a Storybook concern.
