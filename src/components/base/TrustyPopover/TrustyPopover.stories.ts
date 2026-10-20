import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustySwitch from '../TrustySwitch/TrustySwitch.vue'
import TrustyTextInput from '../TrustyTextInput/TrustyTextInput.vue'
import TrustyPopover from './TrustyPopover.vue'

const meta = {
  title: 'Overlays/TrustyPopover',
  component: TrustyPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A floating panel anchored to its trigger, opened by a click and dismissed by clicking outside or pressing Escape. The panel is interactive: put a small form, a set of settings, or a confirmation flow in it.

**Use it when**
- the user needs to deliberately open an overlay to interact with its content.
- use very sparingly.

**Don't use it for**
- purely informational content that needs no action: use TrustyHoverCard.
- a few words of clarification on a control: use TrustyTooltip.
- a plain list of commands: use TrustyDropdownMenu.
- opening actions that could be simplified by removing any nesting.
- another popover's content: NEVER trigger a popover from inside one.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Overline heading; also names the panel for assistive tech.' },
    description: { control: 'text', description: 'Optional supporting line beneath the title.' },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    alignment: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    modal: { control: 'boolean', description: 'Trap focus and block the rest of the page while open.' },
  },
  args: {
    title: 'Keyframe',
    description: 'Description',
    side: 'bottom',
    alignment: 'center',
    modal: false,
  },
  // Give the floating panel room to render inside the docs frame.
  decorators: [() => ({ template: '<div style="padding: 6rem; display: flex; justify-content: center;"><story /></div>' })],
} satisfies Meta<typeof TrustyPopover>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyPopover, TrustyButton, TrustyTextInput },
    setup: () => ({ args }),
    template: `
    <TrustyPopover v-bind="args">
      <template #trigger>
        <TrustyButton label="Edit parameter" />
      </template>
      <TrustyTextInput placeholder="Placeholder" />
    </TrustyPopover>
  `,
  }
}

/** Default: title, description, and a slotted control — the design's shape. */
export const Default: Story = { render }

/** Title only — drop the description when the heading says enough. */
export const TitleOnly: Story = { args: { description: undefined }, render }

/** No header at all: the panel is whatever you slot into it. */
export const ContentOnly: Story = { args: { title: undefined, description: undefined }, render }

/** Anchor to any edge of the trigger. */
export const Right: Story = { args: { side: 'right' }, render }
export const Top: Story = { args: { side: 'top' }, render }

/** Align the panel to the start or end of the trigger. */
export const StartAligned: Story = { args: { alignment: 'start' }, render }

/** Modal — focus is trapped in the panel and the page behind it is inert. */
export const Modal: Story = { args: { modal: true }, render }

/** Several controls in one panel, with the actions the flow needs. */
export const SettingsPanel: Story = {
  args: { title: 'Display settings', description: 'Applies to this view only.' },
  render: (args: Record<string, unknown>) => ({
    components: { TrustyPopover, TrustyButton, TrustySwitch },
    setup: () => ({ args }),
    template: `
      <TrustyPopover v-bind="args">
        <template #trigger>
          <TrustyButton label="Settings" leading-icon="ph:gear" />
        </template>
        <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
          <TrustySwitch label="Show grid" />
          <TrustySwitch label="Snap to keyframes" />
        </div>
      </TrustyPopover>
    `,
  }),
}
