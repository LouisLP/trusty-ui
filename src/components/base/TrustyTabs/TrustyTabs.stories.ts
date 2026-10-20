import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { DefineComponent } from 'vue'
import { expect, userEvent, within } from 'storybook/test'
import TrustyTabs from './TrustyTabs.vue'

// TrustyTabs is generic over its tab values, which Vue types as a bare call signature — Storybook's Meta only accepts object-shaped component types. Pin `T = string` and cast to a concrete component; runtime is unaffected.
type TrustyTabsStory = DefineComponent<Parameters<typeof TrustyTabs<string>>[0]>
const TrustyTabsConcrete = TrustyTabs as unknown as TrustyTabsStory

// Sample panel body — a heading + prose so the content reads as distinct from the tab strip rather than echoing its label/font.
function panel(heading: string, body: string) {
  return `
    <div style="display: grid; gap: var(--space-sm); max-inline-size: var(--size-lg)">
      <h3 style="margin: 0; font-size: var(--font-size-lg); font-weight: 600">${heading}</h3>
      <p style="margin: 0; font-size: var(--font-size-sm); line-height: var(--line-height-normal); color: var(--color-text-muted)">${body}</p>
    </div>
  `
}

const meta = {
  title: 'Navigation/TrustyTabs',
  component: TrustyTabsConcrete,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A tab strip with panels. Each tab's 'value' doubles as the name of the slot holding its panel; leave the slot out and you get a strip-only tab you drive externally through v-model. Tabs take labels, icons, and per-tab disabling, and the strip can run down either side for a vertical layout.

**Use it when**
- one region swaps between a few peer views the user flips between.

**Don't use it for**
- groups that may all stand open at once: use TrustyAccordion
- hierarchical content: use TrustyTree
- many views: the strip runs out of room long before a list would
- a value the user sets rather than a view they switch to: use TrustyToggleGroup
`,
      },
    },
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'right', 'left'] },
    size: { control: 'inline-radio', options: ['md', 'lg', 'xl'] },
  },
  args: {
    placement: 'top',
    size: 'md',
    tabs: [
      { value: 'account', label: 'Account' },
      { value: 'password', label: 'Password' },
      { value: 'team', label: 'Team' },
    ],
    modelValue: 'account',
  },
  render: args => ({
    components: { TrustyTabs },
    setup: () => ({ args }),
    template: `
      <TrustyTabs v-bind="args">
        <template #account>${panel('Your account', 'Update your name, email, and profile photo. Changes apply across every workspace you belong to.')}</template>
        <template #password>${panel('Password', 'Choose a strong, unique password. We recommend at least 12 characters mixing letters, numbers, and symbols.')}</template>
        <template #team>${panel('Team', 'Invite teammates by email and assign roles. Pending invitations expire after seven days.')}</template>
      </TrustyTabs>
    `,
  }),
} satisfies Meta<TrustyTabsStory>

export default meta
type Story = StoryObj<typeof meta>

/** Default horizontal tabs. Panels fill named slots keyed by each `value`. */
export const Default: Story = {}

/** Interaction test — clicking a tab swaps the panel, arrow keys move along the strip skipping the disabled tab, and only the selected trigger is in the tab order (roving tabindex). This is the behaviour Reka's Tabs primitive gives us; the test is here to catch a regression that quietly takes it away. */
export const KeyboardNavigation: Story = {
  args: {
    tabs: [
      { value: 'account', label: 'Account' },
      { value: 'password', label: 'Password', disabled: true },
      { value: 'team', label: 'Team' },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const account = canvas.getByRole('tab', { name: 'Account' })
    const team = canvas.getByRole('tab', { name: 'Team' })

    await step('the selected tab shows its panel', async () => {
      await expect(account).toHaveAttribute('aria-selected', 'true')
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Your account')
    })

    await step('arrow keys skip the disabled tab', async () => {
      account.focus()
      await userEvent.keyboard('{ArrowRight}')
      // Password is disabled, so focus lands on Team, not on it.
      await expect(team).toHaveFocus()
      await expect(team).toHaveAttribute('aria-selected', 'true')
      // Only the selected panel is mounted, so there is exactly one tabpanel.
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Invite teammates')
    })

    await step('the strip is one tab stop', async () => {
      await expect(team).toHaveAttribute('tabindex', '0')
      await expect(account).toHaveAttribute('tabindex', '-1')
    })
  },
}

/** Strip on the left — vertical; arrow keys go up/down. Border/indicator on its right edge. */
export const Left: Story = {
  args: { placement: 'left' },
}

/** Strip on the right — mirror of `left`; border/indicator flip to its left edge. */
export const Right: Story = {
  args: { placement: 'right' },
}

/** `lg` scale — taller triggers, 14px labels. */
export const Large: Story = {
  args: { size: 'lg' },
}

/** `xl` scale — tallest triggers, 18px labels, 24px icons. */
export const ExtraLarge: Story = {
  args: { size: 'xl' },
}

/** Strip only — no panel slots. Drive content living outside the component via `v-model`. */
export const StripOnly: Story = {
  render: args => ({
    components: { TrustyTabs },
    setup: () => ({ args }),
    template: `<TrustyTabs v-bind="args" />`,
  }),
}

/** A disabled tab is skipped by keyboard nav and can't be activated. */
export const DisabledTab: Story = {
  args: {
    tabs: [
      { value: 'account', label: 'Account' },
      { value: 'password', label: 'Password', disabled: true },
      { value: 'team', label: 'Team' },
    ],
  },
}

/** Icon + label tabs. */
export const Icons: Story = {
  args: {
    tabs: [
      { value: 'account', label: 'Account', icon: 'mdi:account' },
      { value: 'settings', label: 'Settings', icon: 'mdi:cog' },
    ],
    modelValue: 'account',
  },
  render: args => ({
    components: { TrustyTabs },
    setup: () => ({ args }),
    template: `
      <TrustyTabs v-bind="args">
        <template #account>${panel('Your account', 'Update your name, email, and profile photo.')}</template>
        <template #settings>${panel('Settings', 'Tune notifications, language, and appearance to your liking.')}</template>
      </TrustyTabs>
    `,
  }),
}

/** Vertical icon-only strip — no labels; each `value` is the tab's accessible name. */
export const VerticalIconsOnly: Story = {
  args: {
    placement: 'left',
    tabs: [
      { value: 'account', icon: 'mdi:account' },
      { value: 'settings', icon: 'mdi:cog' },
    ],
    modelValue: 'account',
  },
  render: args => ({
    components: { TrustyTabs },
    setup: () => ({ args }),
    template: `
      <TrustyTabs v-bind="args">
        <template #account>${panel('Your account', 'Update your name, email, and profile photo.')}</template>
        <template #settings>${panel('Settings', 'Tune notifications, language, and appearance to your liking.')}</template>
      </TrustyTabs>
    `,
  }),
}

/** Vertical strip with icons — same icon-beside-label row as horizontal tabs. */
export const VerticalIcons: Story = {
  args: {
    placement: 'right',
    tabs: [
      { value: 'account', label: 'Account', icon: 'mdi:account' },
      { value: 'settings', label: 'Settings', icon: 'mdi:cog' },
    ],
    modelValue: 'account',
  },
  render: args => ({
    components: { TrustyTabs },
    setup: () => ({ args }),
    template: `
      <TrustyTabs v-bind="args">
        <template #account>${panel('Your account', 'Update your name, email, and profile photo.')}</template>
        <template #settings>${panel('Settings', 'Tune notifications, language, and appearance to your liking.')}</template>
      </TrustyTabs>
    `,
  }),
}
