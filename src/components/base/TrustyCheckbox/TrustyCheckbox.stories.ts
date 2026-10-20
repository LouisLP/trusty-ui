import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyCheckbox from './TrustyCheckbox.vue'

const meta = {
  title: 'Form/Controls/TrustyCheckbox',
  component: TrustyCheckbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A checkbox with a visible label (or an aria-label when omitted). The bound value is a boolean, plus 'indeterminate' for mixed states such as a parent over partially checked children. The box keeps a constant footprint, so nothing jumps on toggle.

**Use it when**
- an independent boolean the user sets and then submits with the rest of a form.
- a parent over partially checked children, through the 'indeterminate' value.

**Don't use it for**
- a setting that takes effect the moment it flips: use TrustySwitch
- picking exactly one of several options: use TrustyRadioGroup, or TrustySelect for longer lists
- a button in a toolbar that stays pressed: use TrustyToggle
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    modelValue: { control: 'inline-radio', options: [false, true, 'indeterminate'] },
  },
  args: {
    label: 'Accept terms',
    size: 'md',
    disabled: false,
    required: false,
    modelValue: false,
  },
} satisfies Meta<typeof TrustyCheckbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = {}
export const Checked: Story = { args: { modelValue: true } }
export const Indeterminate: Story = { args: { modelValue: 'indeterminate' } }
export const Disabled: Story = { args: { disabled: true, modelValue: true } }
export const Small: Story = { args: { size: 'sm', modelValue: true } }

/** No `label` → pair with an `aria-label` for screen readers. */
export const NoLabel: Story = {
  args: { label: '' },
  render: args => ({
    components: { TrustyCheckbox },
    setup: () => ({ args }),
    template: '<TrustyCheckbox v-bind="args" aria-label="Accept terms" />',
  }),
}
