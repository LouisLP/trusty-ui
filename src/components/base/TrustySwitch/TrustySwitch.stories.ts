import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import TrustySwitch from './TrustySwitch.vue'

const meta = {
  title: 'Form/Controls/TrustySwitch',
  component: TrustySwitch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An on/off switch with a visible label (or an aria-label when omitted), bound to a boolean v-model.

**Use it when**
- flipping it takes effect immediately: a mode, a feature, anything the user turns on and sees happen.

**Don't use it for**
- a boolean the user submits with the rest of a form: use TrustyCheckbox
- a mixed or partially-checked state: only TrustyCheckbox has 'indeterminate'
- a button in a toolbar that stays pressed: use TrustyToggle
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    modelValue: { control: 'boolean' },
  },
  args: {
    label: 'Enable notifications',
    disabled: false,
    required: false,
    modelValue: false,
  },
} satisfies Meta<typeof TrustySwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}

/** Interaction test — the switch flips on click and again on Space, and the label is a real `<label for>` so clicking the text toggles it too. Runs in the Interactions panel and under `pnpm test:storybook`. */
export const TogglesOnClick: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const control = canvas.getByRole('switch')

    await expect(control).toHaveAttribute('aria-checked', 'false')

    await userEvent.click(control)
    await expect(control).toHaveAttribute('aria-checked', 'true')

    // The visible label is wired to the control, so it toggles it back off.
    await userEvent.click(canvas.getByText('Enable notifications'))
    await expect(control).toHaveAttribute('aria-checked', 'false')

    // Keyboard parity: focus and Space must do what the click did.
    control.focus()
    await userEvent.keyboard('{ }')
    await expect(control).toHaveAttribute('aria-checked', 'true')
  },
}
export const On: Story = { args: { modelValue: true } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledOn: Story = { args: { disabled: true, modelValue: true } }

/** No `label` → pair with an `aria-label` for screen readers. */
export const NoLabel: Story = {
  args: { label: '' },
  render: args => ({
    components: { TrustySwitch },
    setup: () => ({ args }),
    template: '<TrustySwitch v-bind="args" aria-label="Enable notifications" />',
  }),
}
