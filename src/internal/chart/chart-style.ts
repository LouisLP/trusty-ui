/**
 * Token values and the Chart.js options every plot shares. A canvas cannot resolve
 * `var(--token)`, so the values are read off a live element and handed to Chart.js as real ones.
 */

import type { ChartOptions, ChartType, TooltipModel } from 'chart.js'

export interface ChartTheme {
  /** `--trusty-chart-series-1…n`, in series order. Each plot defines its own palette. */
  series: string[]
  textMuted: string
  textToned: string
  border: string
  borderHighlight: string
  surface: string
  surfaceAccented: string
  fontFamily: string
  fontSize: number
  radius: number
  borderWidth: number
  spaceXs: number
  spaceSm: number
  /** Bar thickness, from `--trusty-chart-bar-size`. Only TrustyBarChart sets it. */
  barSize: number
}

export function readChartTheme(el: Element, seriesCount: number): ChartTheme {
  const style = getComputedStyle(el)
  const rootFontSize = Number.parseFloat(getComputedStyle(el.ownerDocument.documentElement).fontSize) || 16

  const color = (name: string) => style.getPropertyValue(name).trim()

  // Browsers substitute var() when computing a custom property; jsdom does not. One hop only.
  const unaliased = (name: string) => {
    const value = color(name)
    const hop = /^var\(\s*(--[\w-]+)/.exec(value)?.[1]
    return hop ? color(hop) || value : value
  }

  // Custom properties keep their units, so rem still needs resolving against the root.
  const px = (name: string, fallback: number) => {
    const value = unaliased(name)
    const n = Number.parseFloat(value)
    if (!Number.isFinite(n))
      return fallback
    return value.endsWith('rem') ? n * rootFontSize : n
  }

  return {
    series: Array.from({ length: seriesCount }, (_, index) => color(`--trusty-chart-series-${index + 1}`)),
    textMuted: color('--color-text-muted'),
    textToned: color('--color-text-toned'),
    border: color('--color-border'),
    borderHighlight: color('--color-border-highlight'),
    surface: color('--color-bg-elevated'),
    surfaceAccented: color('--color-bg-accented'),
    fontFamily: color('--font-family-sans'),
    fontSize: px('--font-size-xs', 12),
    radius: px('--radius-sm', 4),
    borderWidth: px('--border-md', 2),
    spaceXs: px('--space-xs', 4),
    spaceSm: px('--space-sm', 8),
    barSize: px('--trusty-chart-bar-size', 32),
  }
}

export function chartFont(theme: ChartTheme) {
  return { family: theme.fontFamily, size: theme.fontSize, weight: 600 as const }
}

/** Fill the plot box; ChartBase paints the legend and owns the tooltip, so neither is set here. */
export function chartOptions<TType extends ChartType>(): ChartOptions<TType> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: prefersReducedMotion() ? false : undefined,
    plugins: {
      legend: { display: false },
    },
  } as ChartOptions<TType>
}

/** Title, body and caret from Chart.js's tooltip model — enough to park a TrustyHoverCard on the point. */
export interface ChartHover {
  title: string
  description: string
  /** Series fill, for the colour chip before the Type label. */
  color: string
  x: number
  y: number
}

function cssColor(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * A colour re-expressed at `alpha`, for muting a series while another is hovered.
 * Anything that is not an opaque `oklch()` or `#rgb`/`#rrggbb` is returned untouched — the
 * palette is oklch, so a miss means muting simply no-ops rather than handing Chart.js a broken colour.
 */
export function withAlpha(color: string, alpha: number): string {
  const channels = /^oklch\(([^/)]+)\)$/i.exec(color.trim())?.[1]
  if (channels)
    return `oklch(${channels.trim()} / ${alpha})`

  const group = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())?.[1]
  if (!group)
    return color

  const hex = group.length === 3 ? group.replace(/./g, '$&$&') : group
  const int = Number.parseInt(hex, 16)
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
}

function hoverColor<TType extends ChartType>(model: TooltipModel<TType>): string {
  const painted = model.labelColors?.[0]
  return cssColor(painted?.backgroundColor) || cssColor(painted?.borderColor)
}

export function chartHoverFromTooltip<TType extends ChartType>(model: TooltipModel<TType>): ChartHover | null {
  if (model.opacity === 0 || model.dataPoints.length === 0)
    return null

  const title = (model.title ?? []).filter(Boolean).join(' · ')
  const description = (model.body ?? []).flatMap(item => item.lines).filter(Boolean).join('\n')
  if (!title && !description)
    return null

  return {
    title: title || description,
    description: title ? description : '',
    color: hoverColor(model),
    x: model.caretX,
    y: model.caretY,
  }
}

/** Borderless axis with themed ticks and an optional title. */
export function chartAxis(theme: ChartTheme, label?: string) {
  return {
    border: { display: false },
    title: { display: Boolean(label), text: label, color: theme.textMuted, font: chartFont(theme) },
    ticks: { color: theme.textMuted, font: chartFont(theme) },
  }
}

/** Grid for the value axis: one line per tick, the zero line picked out. */
export function chartValueGrid(theme: ChartTheme) {
  return {
    color: (ctx: { tick: { value: number } }) => ctx.tick.value === 0 ? theme.borderHighlight : theme.border,
    lineWidth: (ctx: { tick: { value: number } }) => ctx.tick.value === 0 ? theme.borderWidth : 1,
  }
}

function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
