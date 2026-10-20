import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustySearchInput from './TrustySearchInput.vue'

const meta = {
  title: 'Form/Controls/TrustySearchInput',
  component: TrustySearchInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single-line search field: a leading magnifier icon and a clear button that appears once there's a value. Same layer-1 contract as TrustyTextInput — it owns just the widget, and 'invalid'/'required' usually arrive through TrustyFormItem's field slot.

**Use it when**
- filtering or searching a list or view.

**Don't use it for**
- ordinary free text: use TrustyTextInput
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    placeholder: 'Search…',
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 20rem;"><story /></div>' })],
} satisfies Meta<typeof TrustySearchInput>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustySearchInput },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: '<TrustySearchInput v-bind="args" v-model="model" aria-label="Search" />',
  }
}

export const Default: Story = { render }
export const Filled: Story = {
  render: args => ({
    components: { TrustySearchInput },
    setup: () => ({ args, model: ref('Sunset') }),
    template: '<TrustySearchInput v-bind="args" v-model="model" aria-label="Search" />',
  }),
}
export const Invalid: Story = { render, args: { invalid: true } }
export const Disabled: Story = {
  render: args => ({
    components: { TrustySearchInput },
    setup: () => ({ args, model: ref('Sunset') }),
    template: '<TrustySearchInput v-bind="args" v-model="model" aria-label="Search" />',
  }),
  args: { disabled: true },
}
