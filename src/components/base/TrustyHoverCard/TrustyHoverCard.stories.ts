import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyBadge from '../TrustyBadge/TrustyBadge.vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyHoverCard from './TrustyHoverCard.vue'

const meta = {
  title: 'Overlays/TrustyHoverCard',
  component: TrustyHoverCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A floating card of read-only detail, opened by hovering its trigger and dismissed when the pointer leaves. Use it to preview supplementary context — type information, metadata, a description — without interrupting the user's flow.

**Use it when**
- extra, non-essential context helps the user understand something they can see.
- use very sparingly.

**Don't use it for**
- anything interactive: no buttons, inputs, or switches. Use TrustyPopover. (The one exception is a control internal to slotted content, such as a code block's own copy button.)
- anything essential. Hover is not a reliable trigger for keyboard or touch users, so critical information must be visible by default or live in a TrustyPopover.
- a few words of hint on a control: use TrustyTooltip.
- another hover card's content: NEVER trigger one from inside one.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Card heading. Required.' },
    description: { control: 'text', description: 'Optional supporting line beneath the title.' },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    alignment: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    open: { control: false },
  },
  args: {
    title: 'Title',
    description: 'Read-only content area. Interactive elements are not permitted.',
    side: 'top',
    alignment: 'center',
  },
  // Give the floating card room to render inside the docs frame.
  decorators: [() => ({ template: '<div style="padding: 6rem; display: flex; justify-content: center;"><story /></div>' })],
} satisfies Meta<typeof TrustyHoverCard>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyHoverCard, TrustyButton },
    setup: () => ({ args }),
    template: `
    <TrustyHoverCard v-bind="args">
      <template #trigger>
        <TrustyButton label="Hover me for the card" variant="ghost" />
      </template>
    </TrustyHoverCard>
  `,
  }
}

/** Default: title and description, no slotted content. */
export const Default: Story = { render }

/** Title only: this should NEVER be used alone (as it's basically a TrustyTooltip). */
export const TitleOnly: Story = { args: { description: undefined }, render }

/** Anchor to any edge of the trigger. */
export const Right: Story = { args: { side: 'right' }, render }
export const Top: Story = { args: { side: 'top' }, render }

/** Align the card to the start of the trigger. */
export const StartAligned: Story = { args: { alignment: 'start' }, render }

/** Metadata rows in the default slot — the design's worked example. Read-only throughout: label/value pairs, no controls. */
export const AttributeTable: Story = {
  args: {
    title: 'Film Grain',
    description: 'Adds 35mm-style grain to a clip, scaled to its resolution.',
  },
  render: (args: Record<string, unknown>) => ({
    components: { TrustyHoverCard, TrustyBadge },
    setup: () => ({
      args,
      rows: [
        { label: 'Type', value: 'Video effect' },
        { label: 'Plugin', value: 'Film Grain' },
        { label: 'Version', value: '1.0.1' },
      ],
    }),
    template: `
      <TrustyHoverCard v-bind="args">
        <template #trigger>
          <TrustyBadge label="effects.film-grain" />
        </template>
        <dl style="display: grid; grid-template-columns: minmax(6.25rem, 12.5rem) 1fr; gap: 0.125rem; margin: 0;">
          <template v-for="row in rows" :key="row.label">
            <dt style="padding: 0.125rem 0.5rem; background-color: var(--color-bg-lowered); font-size: var(--font-size-sm);">
              {{ row.label }}
            </dt>
            <dd style="margin: 0; padding: 0.25rem 0.5rem; background-color: var(--color-bg-lowered); font-size: var(--font-size-xs); color: var(--color-text-muted);">
              {{ row.value }}
            </dd>
          </template>
        </dl>
      </TrustyHoverCard>
    `,
  }),
}
