import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyEditableNumber from './TrustyEditableNumber.vue'

const meta = {
  title: 'Form/Controls/TrustyEditableNumber',
  component: TrustyEditableNumber,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A number that edits in place: it renders as plain text until activated, then commits on Enter or blur (Esc cancels) and fires 'submit'. On commit the value is rounded to 'precision' and clamped into [min, max]; input that isn't a number reverts to the last committed value.

**Use it when**
- tweaking a numeric value where a whole form would be overkill: counts, limits, coordinates.

**Don't use it for**
- ordinary form fields: use TrustyNumberField inside TrustyFormItem
- free text: use TrustyEditableText
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    precision: { control: 'number' },
  },
  args: {
    placeholder: 'Click to edit…',
    disabled: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 22rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyEditableNumber>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyEditableNumber },
    setup() {
      const model = ref(42.5)
      return { args, model }
    },
    template: '<TrustyEditableNumber v-bind="args" v-model="model" aria-label="Speed limit" />',
  }
}

export const Default: Story = { render }
export const Bounded: Story = { render, args: { min: 0, max: 100, precision: 1 } }
export const Empty: Story = {
  render: args => ({
    components: { TrustyEditableNumber },
    setup: () => ({ args, model: ref(null) }),
    template: '<TrustyEditableNumber v-bind="args" v-model="model" aria-label="Speed limit" />',
  }),
}
export const Invalid: Story = { render, args: { invalid: true } }
export const Disabled: Story = { render, args: { disabled: true } }
