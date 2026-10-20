import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustySecretInput from './TrustySecretInput.vue'

const meta = {
  title: 'Form/Controls/TrustySecretInput',
  component: TrustySecretInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A text field for secrets: masked by default, with a reveal toggle that's labelled for screen readers. Same layer-1 contract as TrustyTextInput.

**Use it when**
- collecting passwords, tokens, or API keys.

**Don't use it for**
- ordinary text: use TrustyTextInput
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    toggleLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    placeholder: 'Enter secret…',
    toggleLabel: 'Show secret',
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 22rem;"><story /></div>' })],
} satisfies Meta<typeof TrustySecretInput>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustySecretInput },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: '<TrustySecretInput v-bind="args" v-model="model" aria-label="API key" />',
  }
}

export const Default: Story = { render }
export const Prefilled: Story = {
  render: args => ({
    components: { TrustySecretInput },
    setup: () => ({ args, model: ref('sk-live-9f2c7a1b4e') }),
    template: '<TrustySecretInput v-bind="args" v-model="model" aria-label="API key" />',
  }),
}
export const Invalid: Story = { render, args: { invalid: true } }
export const Disabled: Story = { render, args: { disabled: true } }
