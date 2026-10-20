import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { TrustyChartSeries } from '../../../internal/chart/chart-data'
import { expect, waitFor, within } from 'storybook/test'
import TrustyBarChart from './TrustyBarChart.vue'

const resolutions = ['1080p', '1440p', '4K']

const threeRigs: TrustyChartSeries[] = [
  { label: 'Rig A', values: [144, 98, 52] },
  { label: 'Rig B', values: [121, 80, 41] },
  { label: 'Rig C', values: [96, 61, 30] },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const unculled: TrustyChartSeries[] = [
  { label: 'Unculled', values: [3, 1, 4, 0, 2, 5, 1, 3, 2, 6, 1, 2] },
]

const meta = {
  title: 'Data Display/Charts/TrustyBarChart',
  component: TrustyBarChart,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Categories along the x-axis, one bar per series in each. Chart.js paints the plot; the component draws the panel around it — title, description, legend — and keeps a visually hidden table of the same numbers for assistive tech. Hover a value for a TrustyHoverCard; Chart.js does not draw its own tooltip. Hovering also fades every other bar to 40% opacity, so the one under the pointer reads as the focus.

The chart fills its parent, so give the parent a width and a height (or take the 16rem floor). Bars keep their \`size\` thickness rather than shrinking, so the plot claims the width its clusters need and a narrow parent should scroll — give that scrolling parent \`tabindex="0"\`, or it is unreachable by keyboard.

Pass at most five series: that is how many colours the palette has, and past five they repeat (with a development warning). A short \`values\` array or an explicit \`null\` is a gap, not a zero — no bar, a break in the line, and an empty cell in the table. Categories have no cap. Colour is never the only cue — a legend label travels with every fill.

**Use it when**
- you are comparing up to five series across as many categories as you need
- the values are magnitudes read against a zero baseline

**Don't use it for**
- a trend or a shape across ordered categories: use TrustyLineChart
- a grid of records the user sorts or selects: use TrustyTable
- a single progress value: that is a readout, use TrustyBadge
`,
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'sm', 'xs'] },
    legend: { control: 'boolean' },
  },
  args: {
    title: 'Frame rate by resolution',
    description: 'Average over a 60-second benchmark, ultra preset',
    yAxisLabel: 'Frames per second',
    categories: resolutions,
    series: threeRigs,
    size: 'md',
  },
  // `tabindex` because a scroll container with nothing focusable inside is keyboard-unreachable.
  // A story that needs more room than the default sets `parameters.canvasWidth`.
  decorators: [
    (story, context) => ({
      components: { story },
      setup: () => ({ width: String(context.parameters.canvasWidth ?? '41rem') }),
      template: `
        <div
          tabindex="0"
          :style="{ inlineSize: 'min(100%, ' + width + ')', blockSize: '30rem', overflowX: 'auto' }"
        >
          <story />
        </div>
      `,
    }),
  ],
} satisfies Meta<typeof TrustyBarChart>

export default meta
type Story = StoryObj<typeof meta>

/** Three gaming rigs benchmarked at three resolutions. Legend on, md bars. */
export const Grouped: Story = {
  // The only test against a real canvas: jsdom has no 2D context, so the specs stub Chart.js.
  play: async ({ canvasElement, step }) => {
    const chart = within(canvasElement)
    // TrustyHoverCard portals to document.body.
    const screen = within(canvasElement.ownerDocument.body)

    let canvas!: HTMLCanvasElement
    await step('Chart.js paints a canvas', async () => {
      // Chart.js is a lazy chunk, so the canvas can take well past waitFor's 1s default.
      canvas = await waitFor(() => {
        const found = canvasElement.querySelector('canvas')
        expect(found).not.toBeNull()
        return found!
      }, { timeout: 15000 })
      await waitFor(() => expect(canvas.width).toBeGreaterThan(0), { timeout: 15000 })
    })

    await step('the numbers are in the table behind it', async () => {
      await expect(canvas).toHaveAttribute('aria-hidden', 'true')
      await expect(chart.getByRole('table')).toBeInTheDocument()
      await expect(chart.getByRole('rowheader', { name: 'Rig A' })).toBeInTheDocument()
      await expect(chart.getByRole('columnheader', { name: '4K' })).toBeInTheDocument()
    })

    await step('hovering a bar opens a TrustyHoverCard', async () => {
      // Chart.js clears the tooltip on leaving a bar, and fires `external` during a draw.
      const box = canvas.getBoundingClientRect()
      const label = () => screen.queryByText(/Rig [A-C]: /)

      for (let x = 0.1; x < 0.6 && !label(); x += 0.02) {
        for (let y = 0.2; y < 0.9 && !label(); y += 0.05) {
          canvas.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            clientX: box.left + box.width * x,
            clientY: box.top + box.height * y,
          }))
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        }
      }

      await waitFor(() => expect(label()).toBeVisible(), { timeout: 5000 })
    })
  },
}

/**
 * Five series is the whole palette. Bars stay `--size-control-md`, so the plot claims the width
 * fifteen of them need — hence the wider canvas.
 */
export const FiveSeries: Story = {
  parameters: { canvasWidth: '58rem' },
  // Guards the canvas width: fifteen md bars plus the legend gutter must fit without scrolling.
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector<HTMLElement>('[tabindex="0"]')!
    await waitFor(() => expect(canvasElement.querySelector('canvas')).not.toBeNull(), { timeout: 15000 })
    await waitFor(() => expect(canvasElement.querySelector('.chart-base-legend')).not.toBeNull())

    // Skipped on a viewport too narrow for the 58rem box, where scrolling is correct.
    if (box.clientWidth >= 58 * 16)
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
  },
  args: {
    description: 'Average over a 60-second benchmark, five rigs',
    series: [
      ...threeRigs,
      { label: 'Rig D', values: [110, 72, 36] },
      { label: 'Rig E', values: [160, 115, 64] },
    ],
  },
}

/** One series across twelve months: no legend, since the heading already names it. */
export const SingleSeries: Story = {
  args: {
    title: 'Shoots waiting to be culled',
    description: 'Unreviewed photo shoots by month',
    yAxisLabel: 'Shoots',
    categories: months,
    series: unculled,
  },
}

/** `size: 'sm'` with the legend off: the same three rigs in a tighter panel. */
export const SmallNoLegend: Story = {
  args: {
    size: 'sm',
    legend: false,
  },
}

/** `size: 'xs'`, the densest the bars go — twelve categories still fit without scrolling. */
export const ExtraSmall: Story = {
  args: {
    title: 'Shoots waiting to be culled',
    description: 'Unreviewed photo shoots by month',
    yAxisLabel: 'Shoots',
    categories: months,
    series: unculled,
    size: 'xs',
  },
}
