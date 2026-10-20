import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyTooltip from './TrustyTooltip.vue'

const meta = {
  title: 'Overlays/TrustyTooltip',
  component: TrustyTooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A short text hint that appears on hover or focus, anchored to an edge of its trigger. Plain string only, so every tooltip stays on the design system.

**Use it when**
- a control needs a few words of clarification, icon-only buttons especially.

**Don't use it for**
- anything the user must read to proceed: a tooltip is invisible until discovered. Put essential text in the layout, or in TrustyFormItem's hint for form fields.
`,
      },
    },
  },
  argTypes: {
    text: { control: 'text', description: 'Tooltip text (plain string only).' },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    alignment: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    disabled: { control: 'boolean' },
  },
  args: {
    text: 'Helpful hint',
    side: 'top',
    alignment: 'center',
    disabled: false,
  },
  // Give the floating content room to render inside the docs frame.
  decorators: [() => ({ template: '<div style="padding: 4rem; display: flex; justify-content: center;"><story /></div>' })],
} satisfies Meta<typeof TrustyTooltip>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyTooltip, TrustyButton },
    setup: () => ({ args }),
    template: `
    <TrustyTooltip v-bind="args">
      <TrustyButton label="Hover me for the tooltip" />
    </TrustyTooltip>
  `,
  }
}

/** Default: text on hover/focus, anchored above the trigger. */
export const Default: Story = { render }

/** Anchor to any edge of the trigger. */
export const Right: Story = { args: { side: 'right' }, render }
export const Bottom: Story = { args: { side: 'bottom' }, render }

/** Align the tooltip to the start, center, or end of the trigger. */
export const StartAligned: Story = { args: { alignment: 'start' }, render }
export const EndAligned: Story = { args: { alignment: 'end' }, render }

/** Different anchored side AND alignment. */
export const BottomStartAligned: Story = { args: { side: 'bottom', alignment: 'start' }, render }

/** Disabled — the trigger renders but the tooltip never opens. */
export const Disabled: Story = { args: { disabled: true }, render }
