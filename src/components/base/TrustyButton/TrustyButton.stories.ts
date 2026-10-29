import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from './TrustyButton.vue'

const meta = {
  title: 'Actions/TrustyButton',
  component: TrustyButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The button. Variants cover fill style and colour role, and it carries at most one icon (leading wins over trailing). Omit the label for an icon-only button and pair it with an aria-label.

**Use it when**
- the user clicks to make something happen: submitting, opening, triggering.

**Don't use it for**
- a control that stays pressed to represent on/off state: use TrustyToggle
`,
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    block: { control: 'boolean' },
    label: { control: 'text', description: 'The button text.' },
    icon: { control: 'text', description: 'Leading icon name (e.g. "add" or "mdi:home").' },
    leadingIcon: { control: 'text', description: 'Icon before the label.' },
    trailingIcon: { control: 'text', description: 'Icon after the label (ignored if a leading icon is set).' },
  },
  args: {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    disabled: false,
    block: false,
    label: 'Save changes',
  },
} satisfies Meta<typeof TrustyButton>

export default meta
type Story = StoryObj<typeof meta>

/** Default: the primary variant, a deep persimmon fill under a white label. */
export const Primary: Story = {}

/** Tonal seiji fill with a seiji label; hover and press stay green. */
export const Secondary: Story = { args: { variant: 'secondary' } }

/** Bordered, transparent fill. */
export const Outline: Story = { args: { variant: 'outline' } }

/** Text-only, no fill or border at rest. */
export const Ghost: Story = { args: { variant: 'ghost' } }

/** Destructive actions (kurenai fill) — e.g. the AlertDialog's Delete CTA. */
export const Danger: Story = { args: { variant: 'danger', label: 'Delete' } }

/** Three sizes. */
export const Small: Story = { args: { size: 'sm' } }
export const Large: Story = { args: { size: 'lg' } }

/** A button carries one icon — the leading one. */
export const LeadingIcon: Story = { args: { leadingIcon: 'ph:plus', label: 'Add item' } }

/** A trailing icon (only shown when there is no leading icon). */
export const TrailingIcon: Story = { args: { trailingIcon: 'ph:caret-right', label: 'Continue' } }

/** An Iconify icon (collection:name) resolves through the same prop. */
export const IconifyIcon: Story = { args: { leadingIcon: 'mdi:home', label: 'Home' } }

/** No label → icon-only, squared off automatically. */
export const IconOnly: Story = {
  args: { icon: 'ph:gear', label: '' },
  render: args => ({
    components: { TrustyButton },
    setup: () => ({ args }),
    template: '<TrustyButton v-bind="args" aria-label="Settings" />',
  }),
}

/** Busy state: the spinner always sits on the left. */
export const Loading: Story = { args: { loading: true } }
