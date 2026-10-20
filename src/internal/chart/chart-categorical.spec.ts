import { describe, expect, it, vi } from 'vitest'
import { CATEGORICAL_SERIES_COUNT, categoricalLegend, categoricalTable } from './chart-categorical'

// The palette is CSS and the count is TypeScript; disagreeing means a legend key with no fill.
const chartBaseSource = Object.values(
  import.meta.glob('../../components/private/ChartBase/ChartBase.vue', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)[0] as string

const series = [
  { label: 'Type 1', values: [4500, 1500] },
  { label: 'Type 2', values: [1500] },
]

describe('categoricalLegend', () => {
  it('gives each series the palette colour at its index', () => {
    expect(categoricalLegend(series, true)).toEqual([{
      items: [
        { label: 'Type 1', color: 'var(--trusty-chart-series-1)' },
        { label: 'Type 2', color: 'var(--trusty-chart-series-2)' },
      ],
    }])
  })

  it('warns in development when the series outrun the palette', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tooMany = Array.from({ length: CATEGORICAL_SERIES_COUNT + 1 }, (_, index) => ({
      label: `Type ${index}`,
      values: [1],
    }))

    categoricalLegend(tooMany, true)

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('palette has'))
    warn.mockRestore()
  })

  it('wraps rather than dropping a series past the end of the palette', () => {
    const tooMany = Array.from({ length: CATEGORICAL_SERIES_COUNT + 1 }, (_, index) => ({
      label: `Type ${index}`,
      values: [1],
    }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const items = categoricalLegend(tooMany, true)[0]!.items

    expect(items).toHaveLength(CATEGORICAL_SERIES_COUNT + 1)
    expect(items.at(-1)!.color).toBe(items[0]!.color)
    vi.restoreAllMocks()
  })

  it('is empty when hidden, and for a single series', () => {
    expect(categoricalLegend(series, false)).toEqual([])
    expect(categoricalLegend(series.slice(0, 1), true)).toEqual([])
  })
})

describe('categoricalTable', () => {
  it('puts series down the rows and leaves a missing value a gap, not a zero', () => {
    expect(categoricalTable(['Category 1', 'Category 2'], series)).toEqual({
      columns: ['', 'Category 1', 'Category 2'],
      rows: [
        { header: 'Type 1', values: [4500, 1500] },
        { header: 'Type 2', values: [1500, null] },
      ],
    })
  })
})

describe('categorical series count', () => {
  it('matches the number of --trusty-chart-series-* ChartBase defines', () => {
    const defined = new Set(chartBaseSource.match(/--trusty-chart-series-\d+(?=\s*:)/g) ?? [])

    expect(defined.size).toBe(CATEGORICAL_SERIES_COUNT)
  })
})
