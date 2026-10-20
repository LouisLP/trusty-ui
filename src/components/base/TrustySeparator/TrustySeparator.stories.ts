import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustySeparator from './TrustySeparator.vue'

const meta = {
  title: 'Layout/TrustySeparator',
  component: TrustySeparator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A one- or two-pixel rule that divides content, horizontally or vertically. It carries \`role="separator"\` so screen readers announce the split.

A vertical separator has no height of its own — it stretches to its flex parent, so give that parent a height.

**Use it when**
- two groups sit adjacent and need a visible break between them: menu sections, toolbar clusters, stacked rows.

**Don't use it for**
- spacing: reach for the --space-* tokens instead
- an edge on a surface: give the surface its own border
- splitting regions the user can resize: use TrustySplitter
`,
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: {
    orientation: 'horizontal',
    size: 'sm',
  },
  render: args => ({
    components: { TrustySeparator },
    setup: () => ({ args }),
    template: `
      <div :style="{
        display: 'flex',
        blockSize: args.orientation === 'vertical' ? '128px' : 'auto',
        inlineSize: '128px',
      }">
        <TrustySeparator v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof TrustySeparator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {}
export const HorizontalMedium: Story = { args: { size: 'md' } }
export const Vertical: Story = { args: { orientation: 'vertical' } }
export const VerticalMedium: Story = { args: { orientation: 'vertical', size: 'md' } }

/** Between two blocks of content — the everyday use. */
export const BetweenContent: Story = {
  render: args => ({
    components: { TrustySeparator },
    setup: () => ({ args }),
    template: `
      <div style="inline-size: 240px; color: var(--color-text); font-family: var(--font-family-sans);">
        <p style="margin-block: 0 var(--space-md);">Radial Coordinates</p>
        <TrustySeparator v-bind="args" />
        <p style="margin-block: var(--space-md) 0;">Cartesian Coordinates</p>
      </div>
    `,
  }),
}

/** Vertical, splitting a row of actions into groups. */
export const InAToolbar: Story = {
  args: { orientation: 'vertical' },
  render: args => ({
    components: { TrustySeparator },
    setup: () => ({ args }),
    template: `
      <div
        role="toolbar"
        aria-label="Formatting"
        style="display: flex; gap: var(--space-sm); align-items: center; block-size: 24px; color: var(--color-text); font-family: var(--font-family-sans);"
      >
        <span>Cut</span>
        <TrustySeparator v-bind="args" />
        <span>Copy</span>
        <TrustySeparator v-bind="args" />
        <span>Paste</span>
      </div>
    `,
  }),
}
