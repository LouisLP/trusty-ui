import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import TrustyTagInput from './TrustyTagInput.vue'

const meta = {
  title: 'Form/Controls/TrustyTagInput',
  component: TrustyTagInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A form control whose value is a list of strings. Typing and pressing Enter commits a tag; committed tags become chips above the field, each with a \`×\`. Backspace deletes backwards from the field, ←/→ walk the chips, and pasting a comma-separated list commits the lot. Duplicates and anything past \`max\` are refused rather than silently dropped.

Every chip is blue today — the design calls for a hue per tag, but choosing one needs a colour selector that does not exist yet, so the value stays a plain \`string[]\`.

**Use it when**
- collecting an open-ended list of short strings: keywords, labels, recipients, categories.

**Don't use it for**
- picking from a known list of options: use TrustySelect, or TrustyCombobox when the list is long enough to need filtering
- one free-text value: use TrustyTextInput
- a single tag rendered outside a field, whose click adds or removes it: use TrustyTag
- a row of filter chips: use TrustyFilterTag
- the label, hint and error text around this field: wrap it in TrustyFormItem
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    ariaLabel: { control: 'text', description: 'Accessible name (no visible label is rendered).' },
    max: { control: 'number', description: 'Cap on committed tags. 0 means no cap.' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    ariaLabel: 'Tags',
    placeholder: 'Enter tag name…',
    max: 0,
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 20rem"><story /></div>' })],
} satisfies Meta<typeof TrustyTagInput>

export default meta
type Story = StoryObj<typeof meta>

/** Default — empty, so only the placeholder shows. */
export const Default: Story = {}

/** Committed tags wrap across the field, with the input on its own line beneath. */
export const Filled: Story = {
  args: { modelValue: ['tag', 'label', 'category', 'keyword', 'keyboard'] },
}

/** The error state. `TrustyFormItem` normally sets this from its own slot props. */
export const Invalid: Story = {
  args: { invalid: true, modelValue: ['tag', 'label'] },
}

/** Disabled mutes the surface and every chip's label, and takes the delete buttons with it. */
export const Disabled: Story = {
  args: { disabled: true, modelValue: ['tag', 'label'], placeholder: 'Tags unavailable' },
}

/** Capped at three: a fourth entry is refused and the pending text tints instead. */
export const Capped: Story = {
  args: { max: 3, modelValue: ['tag', 'label', 'category'] },
}

/** Enter commits what you typed, and the new chip appears. */
export const CommitsOnEnter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox')

    await userEvent.type(field, 'apple{Enter}')
    await expect(canvas.getByText('apple')).toBeVisible()

    // The field clears itself, ready for the next one.
    await expect(field).toHaveValue('')

    await userEvent.type(field, 'pear{Enter}')
    await expect(canvas.getByText('pear')).toBeVisible()
  },
}

/** A chip's × removes it, and Backspace from an empty field removes the last one. Reka names each × after the tag it drops, so that is what we query by. */
export const RemovesTags: Story = {
  args: { modelValue: ['tag', 'label'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'tag' }))
    await expect(canvas.queryByText('tag')).not.toBeInTheDocument()

    // Backspace deletes backwards from the empty field: it selects the last chip, then drops it.
    const field = canvas.getByRole('textbox')
    field.focus()
    await userEvent.keyboard('{Backspace}{Backspace}')
    await expect(canvas.queryByText('label')).not.toBeInTheDocument()
  },
}
