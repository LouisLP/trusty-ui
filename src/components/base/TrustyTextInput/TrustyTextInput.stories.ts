import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyTextInput from './TrustyTextInput.vue'

const meta = {
  title: 'Form/Controls/TrustyTextInput',
  component: TrustyTextInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The single-line text field. As a layer-1 control it owns just the widget: no label, hint, or error text of its own, and 'invalid'/'required' usually arrive through TrustyFormItem's field slot.

**Use it when**
- a form needs free text.

**Don't use it for**
- numbers: use TrustyNumberField
- secrets: use TrustySecretInput
- search: use TrustySearchInput
- click-to-edit text in place: use TrustyEditableText
`,
      },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['text', 'email', 'url', 'tel'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    type: 'text',
    placeholder: 'Type here…',
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 20rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyTextInput>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyTextInput },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: '<TrustyTextInput v-bind="args" v-model="model" aria-label="Demo input" />',
  }
}

export const Default: Story = { render }
export const Email: Story = { render, args: { type: 'email', placeholder: 'name@example.com' } }
export const Invalid: Story = { render, args: { invalid: true, placeholder: 'Has an error' } }
export const Disabled: Story = { render, args: { disabled: true } }
