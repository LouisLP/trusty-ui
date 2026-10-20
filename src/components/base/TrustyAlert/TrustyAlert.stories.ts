import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyAlert from './TrustyAlert.vue'

const meta = {
  title: 'Feedback/TrustyAlert',
  component: TrustyAlert,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An inline message that expects a response: the title and description always come paired with action buttons in the default slot (a TrustyButton 'secondary' 'md' for the primary action, 'ghost' 'md' for things like Cancel or Deny).

**Use it when**
- the user has to decide something right where they are (approve or deny a request, act on a warning) without leaving the page.

**Don't use it for**
- messages with nothing to act on: use TrustyBanner
- quick transient notices: use TrustyToast
- decisions serious enough to block the whole screen: use TrustyAlertDialog
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'The headline (plain string only).' },
    description: { control: 'text', description: 'Optional secondary line under the title.' },
    variant: { control: 'inline-radio', options: ['info', 'success', 'warning', 'error'] },
  },
  args: {
    title: 'Title',
    description: 'Description will be shown here.',
    variant: 'info',
  },
  render: args => ({
    components: { TrustyAlert, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyAlert v-bind="args">
        <TrustyButton variant="ghost" size="md" label="Deny" />
        <TrustyButton variant="secondary" size="md" label="Approve" />
      </TrustyAlert>
    `,
  }),
} satisfies Meta<typeof TrustyAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {}
export const Success: Story = { args: { variant: 'success' } }
export const Warning: Story = { args: { variant: 'warning' } }
export const Error: Story = { args: { variant: 'error' } }
export const WithoutDescription: Story = { args: { description: undefined } }
