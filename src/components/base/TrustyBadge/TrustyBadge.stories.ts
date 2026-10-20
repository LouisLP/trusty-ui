import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyBadge from './TrustyBadge.vue'

const meta = {
  title: 'Data Display/TrustyBadge',
  component: TrustyBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small status label: plain text with a colour role and an optional leading glyph. It only conveys state; it isn't interactive.

**Use it when**
- tagging an entity with its current state (running, error, draft) in lists, tables, or headers.

**Don't use it for**
- anything clickable: use TrustyButton
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Status text (plain string only).' },
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'success', 'warning', 'error'],
    },
    icon: { control: 'text', description: 'Optional leading status glyph.' },
  },
  args: {
    label: 'Idle',
    variant: 'neutral',
  },
} satisfies Meta<typeof TrustyBadge>

export default meta
type Story = StoryObj<typeof meta>

/** Default — neutral, the resting status. */
export const Neutral: Story = {}

export const Info: Story = { args: { variant: 'info', label: 'Connecting' } }
export const Success: Story = { args: { variant: 'success', label: 'Online' } }
export const Warning: Story = { args: { variant: 'warning', label: 'Degraded' } }
export const Error: Story = { args: { variant: 'error', label: 'Disconnected' } }

/** With a leading status glyph. */
export const WithIcon: Story = {
  args: { variant: 'success', icon: 'ph:check-circle', label: 'Online' },
}
