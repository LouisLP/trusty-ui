import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import ChartBase from './ChartBase.vue'

// Chart.js needs a real canvas context, which jsdom has none of: the plot is a bare canvas here.
vi.mock('../../../internal/chart/chart-plots', () => {
  const stub = defineComponent({
    name: 'PlotStub',
    props: ['data', 'options'],
    setup: () => () => h('canvas'),
  })
  return { plots: { bar: stub, line: stub } }
})

const table = {
  columns: ['', 'Category 1'],
  rows: [{ header: 'Type 1', values: [4500] }],
}

function mountBase(props: Record<string, unknown> = {}) {
  const wrapper = mount(ChartBase, {
    props: {
      plot: 'bar',
      title: 'Title',
      description: 'Description will be here',
      seriesCount: 5,
      table,
      spec: {},
      build: () => ({ data: { datasets: [] }, options: {} }),
      ...props,
    },
  })
  onTestFinished(() => wrapper.unmount())
  return wrapper
}

describe('chartBase', () => {
  it('names the figure from its heading', () => {
    const wrapper = mountBase()

    expect(wrapper.get('h3').text()).toBe('Title')
    expect(wrapper.get('figure').attributes('aria-labelledby')).toBe(wrapper.get('h3').attributes('id'))
    expect(wrapper.get('.chart-base-description').text()).toBe('Description will be here')
  })

  it('exposes the numbers as a table, since the canvas is hidden', () => {
    const wrapper = mountBase()

    expect(wrapper.get('caption').text()).toBe('Title')
    expect(wrapper.get('tbody tr').text()).toContain('Type 1')
    expect(wrapper.get('tbody tr').text()).toContain('4500')
  })

  it('renders a gap as an empty cell rather than a zero', () => {
    const wrapper = mountBase({
      table: { columns: ['', 'Category 1', 'Category 2'], rows: [{ header: 'Type 1', values: [4500, null] }] },
    })
    const cells = wrapper.findAll('tbody td')

    expect(cells.map(cell => cell.text())).toEqual(['4500', ''])
  })

  it('clips the data table on a wrapper, so the caption cannot paint into the header', () => {
    const wrapper = mountBase()

    expect(wrapper.get('.chart-base-data').element.tagName).toBe('DIV')
    expect(wrapper.find('.chart-base-data table').exists()).toBe(true)
    expect(wrapper.findAll('h3')).toHaveLength(1)
  })

  it('builds the plot from the tokens read off the plot element', async () => {
    const build = vi.fn(() => ({ data: { datasets: [] }, options: {} }))
    const wrapper = mountBase({ build })

    await vi.waitFor(() => expect(wrapper.find('canvas').exists()).toBe(true))
    expect(build).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ series: Array.from({ length: 5 }).fill('') }),
    )
  })

  it('re-reads tokens when themeKey changes, so bar thickness can follow size', async () => {
    const build = vi.fn(() => ({ data: { datasets: [] }, options: {} }))
    const wrapper = mountBase({ build, themeKey: 'md' })

    await vi.waitFor(() => expect(build).toHaveBeenCalled())
    const before = build.mock.calls.length

    await wrapper.setProps({ themeKey: 'xs' })
    await vi.waitFor(() => expect(build.mock.calls.length).toBeGreaterThan(before))
  })

  it('does not rebuild on a re-render that changed nothing it reads', async () => {
    const build = vi.fn(() => ({ data: { datasets: [] }, options: {} }))
    const bump = ref(0)
    // Outside the render function: a literal here would rebuild every render, as `spec` documents.
    const spec = {}
    const Parent = defineComponent({
      setup: () => () => h('div', [
        String(bump.value),
        h(ChartBase, { plot: 'bar', title: 'Title', seriesCount: 5, table, spec, build }),
      ]),
    })
    const wrapper = mount(Parent)
    onTestFinished(() => wrapper.unmount())

    await vi.waitFor(() => expect(build).toHaveBeenCalled())
    const before = build.mock.calls.length

    bump.value++
    await nextTick()
    await nextTick()

    expect(build.mock.calls.length).toBe(before)
  })

  it('keeps the tooltip options a plot sets and only forces the canvas one off', async () => {
    const wrapper = mountBase({
      build: () => ({
        data: { datasets: [] },
        options: { plugins: { tooltip: { mode: 'index' as const } } },
      }),
    })

    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'PlotStub' }).exists()).toBe(true))

    expect(wrapper.getComponent({ name: 'PlotStub' }).props('options').plugins.tooltip).toMatchObject({
      mode: 'index',
      enabled: false,
    })
  })

  it('paints a swatch and a label for every legend key', () => {
    const wrapper = mountBase({
      legend: [
        { items: [{ label: 'Type 1', color: 'var(--trusty-chart-series-1)' }] },
        { title: 'depth', items: [{ label: '48', radius: 2 }] },
      ],
    })
    const keys = wrapper.findAll('.chart-base-legend-key')

    expect(wrapper.get('.chart-base-legend-title').text()).toBe('depth')
    expect(keys).toHaveLength(2)
    expect(keys[0]!.get('.chart-base-swatch').attributes('data-shape')).toBe('box')
    expect(keys[1]!.get('.chart-base-swatch').attributes('data-shape')).toBe('dot')
    expect(keys[1]!.get('.chart-base-swatch').attributes('style')).toContain('4px')
  })

  it('drops the legend column when there are no keys', () => {
    expect(mountBase({ legend: [] }).find('.chart-base-legend').exists()).toBe(false)
  })

  it('opens a TrustyHoverCard from the Chart.js tooltip model', async () => {
    const wrapper = mountBase()

    await vi.waitFor(() => expect(wrapper.find('canvas').exists()).toBe(true))
    wrapper.getComponent({ name: 'PlotStub' }).props('options').plugins.tooltip.external({
      tooltip: {
        opacity: 1,
        caretX: 40,
        caretY: 12,
        title: ['Category 1'],
        body: [{ lines: ['Type 1: 4500'] }],
        dataPoints: [{}],
        labelColors: [{ backgroundColor: '#6fc06f', borderColor: '#6fc06f' }],
      },
    })
    await nextTick()

    expect(document.querySelector('.trusty-hover-card-title')?.textContent?.trim()).toBe('Category 1')
    const row = document.querySelector('.trusty-hover-card-body .chart-base-legend-key')
    expect(row?.textContent?.trim()).toBe('Type 1: 4500')
    expect(row?.querySelector('.chart-base-swatch')?.getAttribute('style')).toContain('111, 192, 111')
  })
})
