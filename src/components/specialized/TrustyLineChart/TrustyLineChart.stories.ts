import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { TrustyChartSeries } from '../../../internal/chart/chart-data'
import TrustyLineChart from './TrustyLineChart.vue'

const session = ['0 min', '15 min', '30 min', '45 min', '60 min']

const temperatures: TrustyChartSeries[] = [
  { label: 'CPU package', values: [38, 61, 68, 71, 72] },
  { label: 'GPU hotspot', values: [36, 70, 79, 84, 86] },
  { label: 'NVMe drive', values: [34, 41, 45, 47, 48] },
]

const weeks = Array.from({ length: 12 }, (_, index) => `W${index + 1}`)

const meta = {
  title: 'Data Display/Charts/TrustyLineChart',
  component: TrustyLineChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
One polyline per series across ordered categories. Same data model and panel as TrustyBarChart — categories, series values, a legend, and a visually hidden table of the numbers — drawn as smooth curves with a point per category, on a cartesian grid (vertical lines at each category). Hover a value for a TrustyHoverCard.

The chart fills its parent, so give the parent a width and a height (or take the 16rem floor). Pass at most five series: that is how many colours the palette has, and past five they repeat (with a development warning). A short \`values\` array or an explicit \`null\` is a gap, not a zero — the line breaks rather than dropping to the baseline. Colour is never the only cue — a legend label travels with every line.

**Use it when**
- you are showing a trend or a shape across ordered categories
- the reader should follow the direction between points, not compare their heights

**Don't use it for**
- comparing magnitudes in unordered categories: use TrustyBarChart
- a grid of records the user sorts or selects: use TrustyTable
`,
      },
    },
  },
  argTypes: {
    legend: { control: 'boolean' },
  },
  args: {
    title: 'Temperatures over a gaming session',
    description: 'Sensor readings, 1440p at 165 Hz',
    yAxisLabel: 'Temperature (°C)',
    categories: session,
    series: temperatures,
  },
  decorators: [() => ({ template: '<div style="inline-size: min(100%, 41rem); block-size: 30rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyLineChart>

export default meta
type Story = StoryObj<typeof meta>

/** Three sensors warming through an hour of play. The GPU carries the load and runs hottest. */
export const Default: Story = {}

/**
 * One series across twelve weeks: no legend, since the heading already names it. Export time
 * climbs as the timeline grows until the proxies are rebuilt in week 9, and week 6 has no
 * export — a `null`, so the line breaks there rather than dropping to zero.
 */
export const SingleSeries: Story = {
  args: {
    title: 'Export time, short film edit',
    description: 'Full-resolution export, weekly',
    yAxisLabel: 'Export time (min)',
    categories: weeks,
    series: [{ label: 'Export time', values: [12, 15, 19, 24, 28, null, 34, 38, 11, 14, 17, 21] }],
  },
}
