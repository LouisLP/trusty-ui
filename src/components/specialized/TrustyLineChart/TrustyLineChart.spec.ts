import type { ChartTheme } from '../../../internal/chart/chart-style'
import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { readChartTheme } from '../../../internal/chart/chart-style'
import { buildLinePlot } from './TrustyLineChart.config'
import TrustyLineChart from './TrustyLineChart.vue'

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
  const wrapper = mount(TrustyLineChart, {
    props: { title: 'Title', categories, series, ...props },
  })
  onTestFinished(() => wrapper.unmount())
  await vi.waitFor(() => expect(wrapper.findComponent({ name: 'PlotStub' }).exists()).toBe(true))
  return wrapper
}

describe('trustyLineChart', () => {
  it('passes the categories and series through to the legend and the table', async () => {
    const wrapper = await mountChart()

    expect(wrapper.get('.chart-base-legend').text()).toContain('Type 2')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.get('thead').text()).toContain('Category 2')
  })
})

describe('buildLinePlot', () => {
  it('draws one smoothed polyline per series, in palette order', () => {
    const { data } = buildLinePlot({ categories, series }, theme)

    expect(data.labels).toEqual(categories)
    expect(data.datasets.map(item => item.data)).toEqual([[4500, 1500], [1500, null]])
    expect(data.datasets[0]).toMatchObject({ borderColor: 'c1', tension: 0.3 })
    expect(data.datasets[1]).toMatchObject({ borderColor: 'c2' })
  })

  it('keeps the line and its points on their base colour when hovered', () => {
    const { data } = buildLinePlot({ categories, series }, theme)

    expect(data.datasets[0]).toMatchObject({
      hoverBorderColor: 'c1',
      hoverBackgroundColor: 'c1',
      pointHoverBackgroundColor: 'c1',
      pointHoverBorderColor: theme.surface,
    })
  })

  it('draws a vertical grid line at each category', () => {
    const { options } = buildLinePlot({ categories, series }, theme)

    expect(options.scales?.x?.grid).toMatchObject({ color: theme.border })
    expect(options.scales?.x?.grid?.display).not.toBe(false)
  })
})
