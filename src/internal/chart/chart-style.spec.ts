import type { TooltipModel } from 'chart.js'
import { describe, expect, it, onTestFinished } from 'vitest'
import { chartHoverFromTooltip, chartOptions, readChartTheme, withAlpha } from './chart-style'

function model(overrides: Partial<TooltipModel<'bar'>>): TooltipModel<'bar'> {
  return {
    opacity: 1,
    caretX: 24,
    caretY: 8,
    title: ['Category 1'],
    body: [{ lines: ['Type 1: 4500'] }],
    dataPoints: [{}],
    ...overrides,
  } as TooltipModel<'bar'>
}

describe('chartHoverFromTooltip', () => {
  it('returns null when the tooltip is hidden or has no points', () => {
    expect(chartHoverFromTooltip(model({ opacity: 0 }))).toBeNull()
    expect(chartHoverFromTooltip(model({ dataPoints: [] }))).toBeNull()
  })

  it('maps Chart.js title and body onto a TrustyHoverCard at the caret', () => {
    expect(chartHoverFromTooltip(model({}))).toEqual({
      title: 'Category 1',
      description: 'Type 1: 4500',
      color: '',
      x: 24,
      y: 8,
    })
  })

  it('reads the series colour so the hover card can paint a chip before the Type', () => {
    expect(chartHoverFromTooltip(model({
      labelColors: [{ backgroundColor: '#6fc06f', borderColor: '#6fc06f' }],
    }))?.color).toBe('#6fc06f')
  })

  it('uses the body as the title when Chart.js has no title lines', () => {
    expect(chartHoverFromTooltip(model({ title: [] }))).toEqual({
      title: 'Type 1: 4500',
      description: '',
      color: '',
      x: 24,
      y: 8,
    })
  })
})

describe('readChartTheme', () => {
  function probe(properties: Record<string, string>) {
    const el = document.createElement('div')
    Object.entries(properties).forEach(([name, value]) => el.style.setProperty(name, value))
    document.body.append(el)
    onTestFinished(() => el.remove())
    return el
  }

  it('resolves bar size through a token alias, not the 32px fallback', () => {
    const el = probe({ '--size-control-xs': '1.125rem', '--trusty-chart-bar-size': 'var(--size-control-xs)' })

    expect(readChartTheme(el, 1).barSize).toBe(18)
  })

  it('converts rem against the root font size and takes px as written', () => {
    const el = probe({ '--trusty-chart-bar-size': '1.5rem', '--border-md': '3px' })
    const theme = readChartTheme(el, 1)

    expect(theme.barSize).toBe(24)
    expect(theme.borderWidth).toBe(3)
  })

  it('falls back rather than handing Chart.js NaN for a unit it cannot parse', () => {
    const el = probe({ '--trusty-chart-bar-size': 'calc(2rem + 1px)' })

    expect(readChartTheme(el, 1).barSize).toBe(32)
  })

  it('reads one palette entry per series the plot declares', () => {
    const el = probe({ '--trusty-chart-series-1': '#111', '--trusty-chart-series-2': '#222' })

    expect(readChartTheme(el, 3).series).toEqual(['#111', '#222', ''])
  })
})

describe('withAlpha', () => {
  it('re-expresses a six-digit hex at the given opacity', () => {
    expect(withAlpha('#6fc06f', 0.4)).toBe('rgba(111, 192, 111, 0.4)')
  })

  it('expands a three-digit hex before applying the opacity', () => {
    expect(withAlpha('#f00', 0.4)).toBe('rgba(255, 0, 0, 0.4)')
  })

  it('leaves a colour it cannot parse untouched, so muting no-ops rather than breaking', () => {
    expect(withAlpha('var(--color-blue-500)', 0.4)).toBe('var(--color-blue-500)')
  })
})

describe('chartOptions', () => {
  it('hides the Chart.js legend, because ChartBase paints an HTML one', () => {
    expect(chartOptions<'bar'>().plugins?.legend).toEqual({ display: false })
  })

  it('says nothing about tooltips, which ChartBase owns', () => {
    expect(chartOptions<'bar'>().plugins?.tooltip).toBeUndefined()
  })
})
