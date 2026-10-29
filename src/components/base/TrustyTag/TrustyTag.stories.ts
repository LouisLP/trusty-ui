import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import TrustyTag from './TrustyTag.vue'

const COLORS = ['blue', 'stone', 'purple', 'forest', 'mint', 'magenta', 'brown'] as const

const meta = {
  title: 'Data Display/TrustyTag',
  component: TrustyTag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A clickable tag chip: a short label in one of seven decorative hues, carrying one glyph that says what clicking it does — a leading \`+\` to add it, or a trailing \`×\` to remove it, never both. The hues mean nothing on their own; the app decides what "purple" stands for.

Every click means the same thing, so the tag holds no state of its own: it emits \`click\` and the app changes its list.

**Use it when**
- letting someone attach or detach keywords, categories or labels on an entity.

**Don't use it for**
- a chip that switches on and off rather than adding or removing anything — a row of filter chips: use TrustyFilterTag
- a status or state you only read, never click: use TrustyBadge
- collecting a list of tags in a form: use TrustyTagInput, which owns the field, the keyboard editing and the v-model
- a general-purpose action: use TrustyButton
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Tag text (plain string only).' },
    color: { control: 'select', options: COLORS },
    action: {
      control: 'inline-radio',
      options: ['add', 'remove'],
      description: 'Which glyph the tag shows, and so what clicking it means.',
    },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'keyword',
    color: 'mint',
    action: 'remove',
    disabled: false,
  },
} satisfies Meta<typeof TrustyTag>

export default meta
type Story = StoryObj<typeof meta>

/** Default — mint, removable, at rest. */
export const Default: Story = {}

/** The `+` affordance: a tag you do not have yet. */
export const Add: Story = { args: { action: 'add', label: 'category' } }

/** Disabled keeps the resting hue and drops the label to muted — the colours carry the state. */
export const Disabled: Story = { args: { disabled: true } }

/** All seven hues. They are decoration: nothing about a hue implies a meaning. */
export const Colors: Story = {
  render: args => ({
    components: { TrustyTag },
    setup: () => ({ args, colors: COLORS }),
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-sm)">
        <TrustyTag v-for="color in colors" :key="color" v-bind="args" :color="color" :label="color" />
      </div>
    `,
  }),
}

/** Every hue in both states, and both glyphs. */
export const AllStates: Story = {
  render: args => ({
    components: { TrustyTag },
    setup: () => ({ args, colors: COLORS }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, max-content); gap: var(--space-sm)">
        <template v-for="color in colors" :key="color">
          <TrustyTag v-bind="args" :color="color" :label="color" />
          <TrustyTag v-bind="args" :color="color" :label="color" action="add" />
          <TrustyTag v-bind="args" :color="color" :label="color" disabled />
        </template>
      </div>
    `,
  }),
}

/** Click, Enter and Space all fire the tag — it is a native button, so the keyboard path comes for free. */
export const ActivatesOnClickAndKeyboard: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const tag = canvas.getByRole('button', { name: 'Remove keyword' })

    await userEvent.click(tag)
    await expect(args.onClick).toHaveBeenCalledTimes(1)

    tag.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onClick).toHaveBeenCalledTimes(2)

    await userEvent.keyboard(' ')
    await expect(args.onClick).toHaveBeenCalledTimes(3)
  },
}

/** A disabled tag ignores both. */
export const DisabledIgnoresActivation: Story = {
  args: { disabled: true, onClick: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const tag = canvas.getByRole('button', { name: 'Remove keyword' })

    await userEvent.click(tag)
    await expect(args.onClick).not.toHaveBeenCalled()
  },
}
