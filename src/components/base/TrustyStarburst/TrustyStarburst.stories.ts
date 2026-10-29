import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyStarburst from './TrustyStarburst.vue'

const meta = {
  title: 'Data Display/TrustyStarburst',
  component: TrustyStarburst,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Old-timey ad emphasis rays, alternating seiji and kaki, with a hand-drawn "line boil": three jittered redraws of the same rays swap on a stepped ~3 fps cycle, so the mark reads as drawn rather than rendered. Under \`prefers-reduced-motion\` it holds still on the first frame.

It is pure ornament — \`aria-hidden\`, no text, no interaction. It has no size of its own: set \`inline-size\` on it, and \`rotate\` or \`scale: -1 1\` to point it the other way.

**Use it when**
- a badge, stamp or status chip wants a burst over it (\`stamp\`)
- a card or hero edge wants rays shooting off it (\`burst\`)
- a display heading wants a comic emphasis ping beside it (\`spark\`)

**Don't use it for**
- anything that carries meaning: it is hidden from assistive tech, so say it in text, or use TrustyBadge
- showing that work is running: use TrustySpinner
- an icon in a control: use TrustyIcon
- dense product UI: one per view, on a marketing or empty-state surface, or it stops reading as emphasis
`,
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['stamp', 'burst', 'spark'] },
  },
  args: {
    variant: 'stamp',
  },
  render: args => ({
    components: { TrustyStarburst },
    setup: () => ({ args }),
    template: `<TrustyStarburst v-bind="args" style="inline-size: 160px;" />`,
  }),
} satisfies Meta<typeof TrustyStarburst>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The three ray sets, each at a width that suits it. */
export const Variants: Story = {
  render: () => ({
    components: { TrustyStarburst },
    template: `
      <div style="display: flex; gap: var(--space-xl); align-items: center;">
        <TrustyStarburst variant="stamp" style="inline-size: 160px;" />
        <TrustyStarburst variant="burst" style="inline-size: 60px;" />
        <TrustyStarburst variant="spark" style="inline-size: 48px;" />
      </div>
    `,
  }),
}

/** `stamp` sits over a badge; position it so the arc's centre meets the badge's top edge. */
export const OverABadge: Story = {
  render: () => ({
    components: { TrustyStarburst },
    template: `
      <div style="display: inline-grid; justify-items: center;">
        <TrustyStarburst variant="stamp" style="inline-size: 140px; margin-block-end: calc(var(--space-sm) * -1);" />
        <span style="padding: var(--space-xs) var(--space-md); border-radius: var(--radius-full); color: var(--color-on-primary-surface); background-color: var(--color-primary-surface); font-family: var(--font-family-sans); font-size: var(--font-size-sm);">
          Open to work
        </span>
      </div>
    `,
  }),
}

/** `spark` beside a display heading; mirrored with `scale: -1 1` it leads instead of trails. */
export const BesideAHeading: Story = {
  render: () => ({
    components: { TrustyStarburst },
    template: `
      <h2 style="display: flex; gap: var(--space-xs); align-items: flex-start; margin: 0; color: var(--color-text); font-family: var(--font-family-display); font-size: var(--font-size-3xl);">
        <TrustyStarburst variant="spark" style="inline-size: 32px; scale: -1 1;" />
        Selected projects
        <TrustyStarburst variant="spark" style="inline-size: 32px;" />
      </h2>
    `,
  }),
}

/** `burst` shoots left off an edge; mirror it for the opposite side. */
export const OffAnEdge: Story = {
  render: () => ({
    components: { TrustyStarburst },
    template: `
      <div style="display: flex; align-items: center;">
        <TrustyStarburst variant="burst" style="inline-size: 48px;" />
        <div style="inline-size: 240px; block-size: 140px; border-radius: var(--radius-lg); background-color: var(--color-bg-elevated);" />
        <TrustyStarburst variant="burst" style="inline-size: 48px; scale: -1 1;" />
      </div>
    `,
  }),
}
