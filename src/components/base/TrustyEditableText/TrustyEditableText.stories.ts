import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyEditableText from './TrustyEditableText.vue'

const meta = {
  title: 'Form/Controls/TrustyEditableText',
  component: TrustyEditableText,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Text that edits in place: it renders as plain text until activated, then commits on Enter or blur (Esc cancels) and fires 'submit'.

**Use it when**
- renaming something where a whole form would be overkill: titles, list entries, tab names.

**Don't use it for**
- ordinary form fields: use TrustyTextInput inside TrustyFormItem
- numeric values with min/max bounds: use TrustyEditableNumber
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    maxLength: { control: 'number' },
  },
  args: {
    placeholder: 'Click to edit…',
    disabled: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 22rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyEditableText>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyEditableText },
    setup() {
      const model = ref('Short Film Edit 01')
      return { args, model }
    },
    template: '<TrustyEditableText v-bind="args" v-model="model" aria-label="Project name" />',
  }
}

export const Default: Story = { render }
export const Empty: Story = {
  render: args => ({
    components: { TrustyEditableText },
    setup: () => ({ args, model: ref('') }),
    template: '<TrustyEditableText v-bind="args" v-model="model" aria-label="Project name" />',
  }),
}
export const Invalid: Story = { render, args: { invalid: true } }
export const Disabled: Story = { render, args: { disabled: true } }
