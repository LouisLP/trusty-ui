import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustySpinner from './TrustySpinner.vue'

const meta = {
  title: 'Feedback/TrustySpinner',
  component: TrustySpinner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An indeterminate busy indicator: the \`loading-spinner\` icon, rotating. It carries \`role="status"\` and announces "Loading…" — a fixed name, so every wait in the product sounds the same.

It has no colour of its own — it inherits \`currentColor\`, so it tints to whatever text colour surrounds it.

**Use it when**
- work is running and you cannot say how far along it is: a fetch in flight, a panel or route still resolving, a region swapped out while it reloads.

**Don't use it for**
- a button that is submitting: TrustyButton has a \`loading\` prop that spins the same icon in place and disables itself
- progress you can measure: show the percentage, not a spin
- a placeholder for content whose shape you already know: a skeleton of that shape reads faster
- a blocking wait the user must acknowledge: use TrustyDialog
- naming *what* is loading: the announcement is fixed — put that in visible text beside it
`,
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'], description: 'Fixed design-token size, on TrustyIcon\'s scale.' },
  },
  args: {
    size: 'md',
  },
} satisfies Meta<typeof TrustySpinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The four sizes, on the same scale as `TrustyIcon`. */
export const Sizes: Story = {
  render: () => ({
    components: { TrustySpinner },
    setup: () => ({ sizes: ['xs', 'sm', 'md', 'lg'] as const }),
    template: `
      <div style="display: flex; gap: var(--space-lg); align-items: center; color: var(--color-primary-highlight);">
        <TrustySpinner v-for="s in sizes" :key="s" :size="s" />
      </div>
    `,
  }),
}

/** It inherits `currentColor`, so it takes the colour of the text around it. */
export const InheritsColour: Story = {
  render: () => ({
    components: { TrustySpinner },
    setup: () => ({ colours: ['var(--color-text)', 'var(--color-text-muted)', 'var(--color-primary-highlight)'] }),
    template: `
      <div style="display: flex; gap: var(--space-lg); align-items: center;">
        <span v-for="c in colours" :key="c" :style="{ color: c }">
          <TrustySpinner />
        </span>
      </div>
    `,
  }),
}

/** Naming the wait is the neighbouring text's job — the spinner always announces "Loading…", so don't repeat the word. */
export const WithVisibleText: Story = {
  args: { size: 'sm' },
  render: args => ({
    components: { TrustySpinner },
    setup: () => ({ args }),
    template: `
      <p style="display: flex; gap: var(--space-sm); align-items: center; margin: 0; color: var(--color-text-toned); font-family: var(--font-family-sans); font-size: var(--font-size-sm);">
        <TrustySpinner v-bind="args" />
        Generating proxies…
      </p>
    `,
  }),
}

/** Centred in the region it is standing in for. */
export const InAPanel: Story = {
  args: { size: 'lg' },
  render: args => ({
    components: { TrustySpinner },
    setup: () => ({ args }),
    template: `
      <div style="display: grid; place-items: center; inline-size: 320px; block-size: 160px; color: var(--color-text-muted); background-color: var(--color-bg-elevated); border-radius: var(--radius-md);">
        <TrustySpinner v-bind="args" />
      </div>
    `,
  }),
}
