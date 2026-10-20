import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import TrustyBanner from './TrustyBanner.vue'

const meta = {
  title: 'Feedback/TrustyBanner',
  component: TrustyBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A static inline message: a title, an optional description, and no actions. It sits in the layout and informs, nothing more.

**Dismissing depends on the severity.** If the user can simply ignore the notice or resolve it themselves, they may close it; if it reports a system problem they cannot act on — "connection lost" — it stays until the condition does.

| Variant | Dismiss button | Why |
| --- | --- | --- |
| \`info\` | by default | context the reader has now taken in |
| \`success\` | by default | the outcome is already theirs |
| \`warning\` | opt in with \`dismissible\` | depends on whether the reader can resolve it |
| \`error\` | never | the condition outlives the banner; \`dismissible\` is ignored |

Dismissing sets \`open\` to false and the banner renders nothing. Leave \`open\` unbound to let it close itself, or bind \`v-model:open\` to decide when the notice comes back.

**Use it when**
- something about the current screen is worth knowing but needs no response (a read-only notice, context for a section).

**Don't use it for**
- messages the user must act on: use TrustyAlert
- transient 'that worked' notices: use TrustyToast
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'The headline (plain string only).' },
    description: { control: 'text', description: 'Optional secondary line under the title.' },
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'error'] },
    dismissible: {
      control: 'boolean',
      description: 'Override the severity default. Ignored on `error`.',
    },
    open: { control: 'boolean', description: 'Two-way; false renders nothing.' },
  },
  args: {
    title: 'Title',
    description: 'Description will be shown here.',
    variant: 'info',
  },
} satisfies Meta<typeof TrustyBanner>

export default meta
type Story = StoryObj<typeof meta>

/** Dismissible by default: the reader has taken the context in and can close it. */
export const Info: Story = {}

/** Dismissible by default: the outcome is already theirs. */
export const Success: Story = { args: { variant: 'success' } }

/** Persistent by default — a warning the reader may not be able to resolve. */
export const Warning: Story = { args: { variant: 'warning' } }

/** Always persistent: the condition outlives the banner, so there is nothing to close. */
export const Error: Story = { args: { variant: 'error' } }

export const WithoutDescription: Story = { args: { description: undefined } }

/** `dismissible` is the opt-in for a warning the reader *can* resolve — a stale filter, an unsaved draft. */
export const DismissibleWarning: Story = {
  args: { variant: 'warning', dismissible: true, title: 'Filters are still applied' },
}

/** `dismissible` turns the button off where the severity would have offered it. */
export const PersistentInfo: Story = {
  args: { dismissible: false, title: 'Connection lost', description: 'Retrying every 5 seconds.' },
}

/** Clicking the dismiss button closes the banner: it leaves the layout entirely, rather than emptying in place. */
export const DismissesOnClick: Story = {
  args: { title: 'Update available', description: 'Version 2.4 is ready to install.' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the banner starts open', async () => {
      await expect(canvas.getByText('Update available')).toBeVisible()
    })

    await step('the dismiss button closes it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
      await expect(canvas.queryByText('Update available')).not.toBeInTheDocument()
    })
  },
}
