import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyCombobox from './TrustyCombobox.vue'

const meta = {
  title: 'Form/Controls/TrustyCombobox',
  component: TrustyCombobox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single-value picker with type-to-filter: an input that opens a filtered option list, with an emptyText for when nothing matches. It's a layer-1 form control, so 'invalid' and 'required' usually arrive via TrustyFormItem's field slot.

The clear button is part of the field's active state: it appears only while the combobox is hovered or focused and there is text to clear, so a row of resting fields stays quiet.

**Use it when**
- choosing sets a value and the list is too long or too dynamic to scan (users, devices, hundreds of entries), so filtering beats scrolling.

**Don't use it for**
- short, known lists users can scan at a glance: use TrustySelect
- menus of commands: use TrustyDropdownMenu
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    ariaLabel: { control: 'text' },
    emptyText: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    items: { control: 'object' },
  },
  args: {
    placeholder: 'Select…',
    ariaLabel: 'Team member',
    emptyText: 'No matching team member.',
    disabled: false,
    required: false,
    invalid: false,
    items: [
      { value: 'louis', label: 'Louis' },
      { value: 'francis', label: 'Francis' },
      { value: 'katya', label: 'Katya' },
      { value: 'adnan', label: 'Adnan (unavailable)', disabled: true },
      { value: 'maksym', label: 'Maksym' },
    ],
  },
  // Give the portalled list room inside the Storybook frame.
  decorators: [() => ({
    template: '<div style="padding: 4rem; max-inline-size: 18rem; margin-inline: auto;"><story /></div>',
  })],
} satisfies Meta<typeof TrustyCombobox>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyCombobox },
    setup() {
      const model = ref<string>()
      return { args, model }
    },
    template: `<TrustyCombobox v-bind="args" v-model="model" />`,
  }
}

/** Default: type to filter, arrow keys to move, Enter to pick. */
export const Default: Story = { render }

/** Interaction test — with a value selected, the clear button is absent until the field is focused, and clearing still works. Hover it here to see the same reveal by pointer. */
export const ClearAppearsWhenActive: Story = {
  render: args => ({
    components: { TrustyCombobox },
    setup() {
      const model = ref('louis')
      return { args, model }
    },
    template: `<TrustyCombobox v-bind="args" v-model="model" />`,
  }),
  // Only the ':focus-within' half of the rule is asserted: synthetic pointer events don't trigger CSS ':hover', so the hover half can only be seen with a real pointer.
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('combobox')
    // Queried by class, not by role and name: while the button is visibility:hidden its accessible name computes to '', so getByRole('button', { name: 'Clear' }) cannot find it at rest — which is exactly the point of the change.
    const clear = canvasElement.querySelector('.trusty-combobox-cancel')!

    await step('hidden while the field rests, though there is a label to clear', async () => {
      await expect(input).toHaveValue('Louis')
      await expect(clear).not.toBeVisible()
    })

    await step('focusing the field reveals it', async () => {
      await userEvent.click(input)
      await waitFor(() => expect(clear).toBeVisible())
    })

    await step('and it still clears the selection', async () => {
      await userEvent.click(clear)
      await expect(input).toHaveValue('')
    })

    await step('hidden again once the field is left, with nothing focused', async () => {
      ;(input as HTMLInputElement).blur()
      await waitFor(() => expect(clear).not.toBeVisible())
    })
  },
}

/** Pre-selected value via v-model — the input shows its label. */
export const Preselected: Story = {
  render: args => ({
    components: { TrustyCombobox },
    setup() {
      const model = ref('louis')
      return { args, model }
    },
    template: `<TrustyCombobox v-bind="args" v-model="model" />`,
  }),
}

/** Error state — red border + ring, as driven by TrustyFormItem. */
export const Invalid: Story = { args: { invalid: true }, render }

/** Disabled — the input renders but the list never opens. */
export const Disabled: Story = { args: { disabled: true }, render }
