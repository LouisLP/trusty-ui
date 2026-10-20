import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyScrollArea from './TrustyScrollArea.vue'

const meta = {
  title: 'Layout/TrustyScrollArea',
  component: TrustyScrollArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A scroll container with design-system scrollbars that reveal on hover or scroll, then fade out. Pick vertical, horizontal, or both (vertical by default).

**Use it when**
- a panel scrolls and native scrollbars would look heavy or inconsistent across platforms.

**Don't use it for**
- the page itself: the document's own scrollbar is the right one there
- content that should size to its container instead of scrolling: fix the layout first
- making a very long list cheap to render: this styles scrollbars, it does not virtualize
`,
      },
    },
  },
  argTypes: {
    axis: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
  },
  args: {
    axis: 'vertical',
  },
  // A fixed box so the content overflows and the scrollbars have something to do.
  decorators: [() => ({ template: '<div style="block-size: 14rem; inline-size: 18rem; border: 1px solid var(--color-border); border-radius: var(--radius-md);"><story /></div>' })],
} satisfies Meta<typeof TrustyScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const rows = Array.from({ length: 25 }, (_, i) => `Item ${i + 1}`)

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyScrollArea },
    setup: () => ({ args, rows }),
    template: `
      <TrustyScrollArea v-bind="args">
        <div style="padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); color: var(--color-text);">
          <div v-for="row in rows" :key="row">{{ row }}</div>
        </div>
      </TrustyScrollArea>
    `,
  }
}

/** Vertical scrolling; the scrollbar appears on hover/scroll. */
export const Default: Story = { render }

/** Horizontal scrolling on a wide row of content. */
export const Horizontal: Story = {
  args: { axis: 'horizontal' },
  render: args => ({
    components: { TrustyScrollArea },
    setup: () => ({ args }),
    template: `
      <TrustyScrollArea v-bind="args">
        <div style="display: flex; gap: var(--space-md); padding: var(--space-md); color: var(--color-text);">
          <div v-for="n in 20" :key="n" style="flex: none; inline-size: 8rem;">Column {{ n }}</div>
        </div>
      </TrustyScrollArea>
    `,
  }),
}

/** Both scrollbars, with a corner where they meet. */
export const BothAxes: Story = {
  args: { axis: 'both' },
  render: args => ({
    components: { TrustyScrollArea },
    setup: () => ({ args }),
    template: `
      <TrustyScrollArea v-bind="args">
        <div style="inline-size: 40rem; padding: var(--space-md); color: var(--color-text);">
          <p v-for="n in 25" :key="n" style="white-space: nowrap;">Row {{ n }} — a long line that overflows horizontally as well as vertically.</p>
        </div>
      </TrustyScrollArea>
    `,
  }),
}
