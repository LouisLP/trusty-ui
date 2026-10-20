import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyRadioGroup from './TrustyRadioGroup.vue'

const options = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
  { value: 'overnight', label: 'Overnight', disabled: true },
]

const meta = {
  title: 'Form/Controls/TrustyRadioGroup',
  component: TrustyRadioGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single-choice control that lays every option out in the open, one radio per row. It's a layer-1 form control; inside TrustyFormItem, set 'group' so the label wires up via aria-labelledby.

**Use it when**
- there are only a few options (up to about five) and seeing them side by side helps the decision: modes, plans, strategies.

**Don't use it for**
- longer lists or tight layouts, where TrustySelect keeps things compact
`,
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    options: { control: 'object' },
  },
  args: {
    size: 'md',
    orientation: 'vertical',
    disabled: false,
    required: false,
    options,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 22rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyRadioGroup>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyRadioGroup },
    setup() {
      const model = ref<string>()
      return { args, model }
    },
    template: '<TrustyRadioGroup v-bind="args" v-model="model" aria-label="Shipping speed" />',
  }
}

export const Default: Story = { render }
export const Horizontal: Story = { render, args: { orientation: 'horizontal' } }
export const Preselected: Story = {
  render: args => ({
    components: { TrustyRadioGroup },
    setup: () => ({ args, model: ref('express') }),
    template: '<TrustyRadioGroup v-bind="args" v-model="model" aria-label="Shipping speed" />',
  }),
}
export const Disabled: Story = { render, args: { disabled: true } }
export const Small: Story = { render, args: { size: 'sm' } }
