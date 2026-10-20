import type { ChartTheme } from '../../../internal/chart/chart-style'
import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { readChartTheme } from '../../../internal/chart/chart-style'
import { barHoverBackgrounds, buildBarPlot } from './TrustyBarChart.config'
import TrustyBarChart from './TrustyBarChart.vue'

vi.mock('../../../internal/chart/chart-plots', () => {
  const stub = defineComponent({
    name: 'PlotStub',
    props: ['data', 'options'],
    setup: () => () => h('canvas'),
  })
  return { plots: { bar: stub, line: stub } }
})

const categories = ['Category 1', 'Category 2']
const series = [
  { label: 'Type 1', values: [4500, 1500] },
  { label: 'Type 2', values: [1500] },
]

const theme: ChartTheme = { ...readChartTheme(document.body, 5), series: ['c1', 'c2', 'c3', 'c4', 'c5'] }

// Await the async plot inside the test, or its import settles after the mocks are gone.
async function mountChart(props: Record<string, unknown> = {}) {
  const wrapper = mount(TrustyBarChart, {
    props: { title: 'Title', categories, series, ...props },
  })
  onTestFinished(() => wrapper.unmount())
  await vi.waitFor(() => expect(wrapper.findComponent({ name: 'PlotStub' }).exists()).toBe(true))
  return wrapper
}

describe('trustyBarChart', () => {
  it('reflects the bar size on the root', async () => {
    expect((await mountChart()).get('figure').attributes('data-size')).toBe('md')
    expect((await mountChart({ size: 'xs' })).get('figure').attributes('data-size')).toBe('xs')
  })

  it('hands the stylesheet its cluster counts as plain numbers', async () => {
    const style = (await mountChart()).get('figure').attributes('style')

    expect(style).toContain('--trusty-chart-categories: 2')
    expect(style).toContain('--trusty-chart-series-count: 2')
  })

  it('passes the categories and series through to the legend and the table', async () => {
    const wrapper = await mountChart()

    expect(wrapper.get('.chart-base-legend').text()).toContain('Type 1')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.get('thead').text()).toContain('Category 2')
  })

  it('hides the legend for a single series', async () => {
    const wrapper = await mountChart({ series: series.slice(0, 1) })

    expect(wrapper.find('.chart-base-legend').exists()).toBe(false)
  })
})

describe('buildBarPlot', () => {
  it('maps categories onto labels and hands Chart.js null for a gap', () => {
    const { data } = buildBarPlot({ categories, series }, theme)

    expect(data.labels).toEqual(categories)
    expect(data.datasets.map(item => item.data)).toEqual([[4500, 1500], [1500, null]])
    expect(data.datasets.map(item => item.backgroundColor)).toEqual(['c1', 'c2'])
  })

  it('keeps the hovered bar on its base colour, so hover never intensifies it', () => {
    const { data } = buildBarPlot({ categories, series }, theme)

    expect(data.datasets.map(item => item.hoverBackgroundColor)).toEqual(['c1', 'c2'])
  })

  it('pins bars to the token thickness and spends the surplus slot on the gap', () => {
    const { options } = buildBarPlot({ categories, series }, theme)

    expect(options.datasets?.bar).toMatchObject({
      barThickness: theme.barSize + theme.spaceXs,
      maxBarThickness: theme.barSize,
    })
  })

  it('titles the y-axis only when asked', () => {
    const titled = buildBarPlot({ categories, series, yAxisLabel: 'y-axis label' }, theme)

    expect(titled.options.scales?.y?.title).toMatchObject({ display: true, text: 'y-axis label' })
    expect(buildBarPlot({ categories, series }, theme).options.scales?.y?.title?.display).toBe(false)
  })
})

describe('barHoverBackgrounds', () => {
  const bases = ['#6fc06f', '#6998c6']

  it('keeps every dataset on its flat colour while nothing is hovered', () => {
    expect(barHoverBackgrounds(bases, [2, 2], null)).toEqual(['#6fc06f', '#6998c6'])
  })

  it('leaves only the hovered bar at full colour and mutes the rest to 40%', () => {
    expect(barHoverBackgrounds(bases, [2, 2], { datasetIndex: 1, index: 0 })).toEqual([
      ['rgba(111, 192, 111, 0.4)', 'rgba(111, 192, 111, 0.4)'],
      ['#6998c6', 'rgba(105, 152, 198, 0.4)'],
    ])
  })

  it('sizes each dataset\'s array to its own bar count', () => {
    const [first, second] = barHoverBackgrounds(bases, [3, 1], { datasetIndex: 0, index: 2 })

    expect(first).toHaveLength(3)
    expect(second).toHaveLength(1)
  })
})
