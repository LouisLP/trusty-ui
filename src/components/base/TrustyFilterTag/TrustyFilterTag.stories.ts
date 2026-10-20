import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import TrustyFilterTag from './TrustyFilterTag.vue'

const COLORS = ['blue', 'stone', 'purple', 'forest', 'mint', 'magenta', 'brown'] as const

const meta = {
  title: 'Data Display/TrustyFilterTag',
  component: TrustyFilterTag,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A tag chip that switches on and off. Same seven decorative hues as \`TrustyTag\`, no glyph, and a ring while it is on — clicking flips \`v-model\` and \`aria-pressed\` with it, so assistive tech reads the chip as a toggle button. Nothing is added or destroyed by a click; the chip only says whether its facet is currently on.

Each chip owns one boolean. A row of them is a plain \`v-for\` over the app's facets — there is no group component, because the app already holds the shape of its filter state.

**Use it when**
- offering a row of filter or facet chips over a list, a log, or a canvas.
- toggling a view option that reads as a label rather than a control: "errors", "archived", "mine".

**Don't use it for**
- attaching or detaching a tag on an entity — a chip whose click means add or remove: use TrustyTag
- a status or state you only read, never click: use TrustyBadge
- collecting a list of tags in a form: use TrustyTagInput
- a toggle that reads as a control rather than a tag, or one that needs an icon: use TrustyToggle, or TrustyToggleGroup for a mutually exclusive set
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Chip text (plain string only).' },
    color: { control: 'select', options: COLORS },
    modelValue: { control: 'boolean', description: 'Whether the filter is on.' },
    disabled: { control: 'boolean' },
  },
  args: {
    label: 'errors',
    color: 'blue',
    modelValue: false,
    disabled: false,
  },
} satisfies Meta<typeof TrustyFilterTag>

export default meta
type Story = StoryObj<typeof meta>

/** Default — blue, off. */
export const Default: Story = {}

/** On: the ring, and `aria-pressed="true"`. */
export const Selected: Story = { args: { modelValue: true } }

/** Disabled keeps the resting hue and drops the label to muted — the colours carry the state. */
export const Disabled: Story = { args: { disabled: true } }

/** All seven hues. They are decoration: nothing about a hue implies a meaning. */
export const Colors: Story = {
  render: args => ({
    components: { TrustyFilterTag },
    setup: () => ({ args, colors: COLORS }),
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-sm)">
        <TrustyFilterTag v-for="color in colors" :key="color" v-bind="args" :color="color" :label="color" />
      </div>
    `,
  }),
}

/** Every hue across the three states the design specifies: off, on, disabled. */
export const AllStates: Story = {
  render: args => ({
    components: { TrustyFilterTag },
    setup: () => ({ args, colors: COLORS }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, max-content); gap: var(--space-sm)">
        <template v-for="color in colors" :key="color">
          <TrustyFilterTag v-bind="args" :color="color" :label="color" />
          <TrustyFilterTag v-bind="args" :color="color" :label="color" :model-value="true" />
          <TrustyFilterTag v-bind="args" :color="color" :label="color" disabled />
        </template>
      </div>
    `,
  }),
}

/** A filter bar: one chip per facet, the app holding the set of what is on. */
export const FilterBar: Story = {
  render: () => ({
    components: { TrustyFilterTag },
    setup() {
      const facets = [
        { label: 'errors', color: 'magenta' },
        { label: 'warnings', color: 'brown' },
        { label: 'info', color: 'blue' },
        { label: 'archived', color: 'stone' },
      ] as const
      return { facets }
    },
    data: () => ({ on: { errors: true } as Record<string, boolean> }),
    template: `
      <div>
        <div style="display: flex; flex-wrap: wrap; gap: var(--space-sm)">
          <TrustyFilterTag
            v-for="facet in facets"
            :key="facet.label"
            v-model="on[facet.label]"
            :label="facet.label"
            :color="facet.color"
          />
        </div>
        <p style="margin-block-start: var(--space-md); color: var(--color-text-toned); font-size: var(--font-size-xs)">
          On: {{ Object.keys(on).filter(key => on[key]).join(', ') || 'nothing' }}
        </p>
      </div>
    `,
  }),
}

/** Click, Enter and Space all flip it — it is a native button, so the keyboard path comes for free. */
export const TogglesOnClickAndKeyboard: Story = {
  render: args => ({
    components: { TrustyFilterTag },
    setup: () => ({ args }),
    data: () => ({ on: false }),
    template: `<TrustyFilterTag v-bind="args" v-model="on" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas.getByRole('button', { name: 'errors' })
    await expect(chip).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(chip)
    await expect(chip).toHaveAttribute('aria-pressed', 'true')

    await userEvent.keyboard('{Enter}')
    await expect(chip).toHaveAttribute('aria-pressed', 'false')

    await userEvent.keyboard(' ')
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
  },
}

/** A disabled chip ignores both. */
export const DisabledIgnoresActivation: Story = {
  args: { disabled: true },
  render: args => ({
    components: { TrustyFilterTag },
    setup: () => ({ args }),
    data: () => ({ on: false }),
    template: `<TrustyFilterTag v-bind="args" v-model="on" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas.getByRole('button', { name: 'errors' })

    await userEvent.click(chip)
    await expect(chip).toHaveAttribute('aria-pressed', 'false')
  },
}
