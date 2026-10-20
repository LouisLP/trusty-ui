import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyToggle from './TrustyToggle.vue'

const meta = {
  title: 'Form/Controls/TrustyToggle',
  component: TrustyToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A two-state button that stays pressed or released, bound to a boolean v-model. Takes a label, an icon before it, or an icon alone paired with an aria-label.

**Use it when**
- a toolbar button holds its state: bold, snap-to-grid, show-overlay.

**Don't use it for**
- a labelled setting in a form: use TrustyCheckbox, or TrustySwitch when it applies immediately
- one of several mutually exclusive modes: use TrustyToggleGroup
- something that happens once when clicked: use TrustyButton
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    icon: { control: 'text', description: 'Icon name (e.g. "settings" or "mdi:home").' },
    disabled: { control: 'boolean' },
    modelValue: { control: 'boolean' },
  },
  args: {
    label: 'Bold',
    disabled: false,
    modelValue: false,
  },
} satisfies Meta<typeof TrustyToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}
export const On: Story = { args: { modelValue: true } }
export const WithIcon: Story = { args: { icon: 'ph:gear', label: 'Settings' } }
export const Disabled: Story = { args: { disabled: true } }

/** Icon, no label → squares off. Pair with an `aria-label`. */
export const IconOnly: Story = {
  args: { icon: 'ph:gear', label: '' },
  render: args => ({
    components: { TrustyToggle },
    setup: () => ({ args }),
    template: '<TrustyToggle v-bind="args" aria-label="Settings" />',
  }),
}
