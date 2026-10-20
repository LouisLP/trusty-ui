import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { DefineComponent } from 'vue'
import { expect, userEvent, within } from 'storybook/test'
import TrustyNavigationTabs from './TrustyNavigationTabs.vue'

// TrustyNavigationTabs is generic over its tab values, which Vue types as a bare call signature — Storybook's Meta only accepts object-shaped component types. Pin `T = string` and cast to a concrete component; runtime is unaffected.
type TrustyNavigationTabsStory = DefineComponent<Parameters<typeof TrustyNavigationTabs<string>>[0]>
const TrustyNavigationTabsConcrete = TrustyNavigationTabs as unknown as TrustyNavigationTabsStory

const SETTINGS = [
  { value: 'preferences', label: 'Preferences', icon: 'mdi:cog-outline' },
  { value: 'account', label: 'Account', icon: 'mdi:account-circle-outline' },
  { value: 'privacy', label: 'Privacy', icon: 'mdi:shield-lock-outline' },
  { value: 'usage', label: 'Usage', icon: 'mdi:chart-box-outline' },
  { value: 'memory', label: 'Memory', icon: 'mdi:history' },
]

// Sample panel body — a heading + prose so the panel reads as distinct from the rail rather than echoing its label/font.
function panel(heading: string, body: string) {
  return `
    <div style="display: grid; gap: var(--space-sm); max-inline-size: var(--size-md)">
      <h3 style="margin: 0; font-size: var(--font-size-lg); font-weight: 600">${heading}</h3>
      <p style="margin: 0; font-size: var(--font-size-sm); line-height: var(--line-height-normal); color: var(--color-text-muted)">${body}</p>
    </div>
  `
}

const meta = {
  title: 'Navigation/TrustyNavigationTabs',
  component: TrustyNavigationTabsConcrete,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A vertical rail of tabs that stands beside the region it drives — the settings-dialog sidebar, the tool toolbar. Always vertical, so arrow keys run up and down. The active tab takes a filled wash and a bar on the rail's outer edge, which is what makes it read as a place you are rather than a control you pressed. Each tab's 'value' doubles as the name of the slot holding its panel; leave the slot out and you get a rail-only strip you drive externally through v-model.

It is the same machinery as TrustyTabs — same Reka primitive, same tab semantics — dressed as a navigation rail. Reach for it when the strip is the frame around the content rather than a control inside it.

**Use it when**
- a persistent sidebar swaps a large content region beside it, like a settings dialog
- an icon rail picks the active tool or view and stays on screen while you work

**Don't use it for**
- an inline strip above the region it swaps: use TrustyTabs, which runs horizontally too
- items that are real destinations and change the URL: use plain links, so they can be middle-clicked, copied and land fresh
- a value the user sets rather than a view they switch to: use TrustyToggleGroup
- groups that may all stand open at once: use TrustyAccordion
- hierarchical content: use TrustyTree
`,
      },
    },
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['left', 'right'] },
    size: { control: 'inline-radio', options: ['md', 'lg', 'xl'] },
  },
  args: {
    placement: 'left',
    size: 'md',
    tabs: SETTINGS.slice(0, 3),
    modelValue: 'account',
  },
  render: args => ({
    components: { TrustyNavigationTabs },
    setup: () => ({ args }),
    template: `
      <TrustyNavigationTabs v-bind="args">
        <template #preferences>${panel('Preferences', 'Theme, language, and the shortcuts you reach for most. Changes apply the moment you make them.')}</template>
        <template #account>${panel('Account', 'Your name, avatar, and the address we send receipts to. Used across every workspace you belong to.')}</template>
        <template #privacy>${panel('Privacy', 'Decide what gets stored and for how long. Nothing here is shared with anyone outside your organisation.')}</template>
      </TrustyNavigationTabs>
    `,
  }),
} satisfies Meta<TrustyNavigationTabsStory>

export default meta
type Story = StoryObj<typeof meta>

/** The default rail — docked left, bar on its outer edge, panel to the right. */
export const Default: Story = {}

/**
 * Interaction test — clicking a tab swaps the panel, arrow keys run up and down the rail
 * skipping the disabled tab, and only the selected trigger is in the tab order (roving
 * tabindex). This is what the Tabs primitive buys us over a plain list of links; the test
 * is here to catch a regression that quietly takes it away.
 */
export const KeyboardNavigation: Story = {
  args: {
    tabs: [
      { value: 'preferences', label: 'Preferences' },
      { value: 'account', label: 'Account', disabled: true },
      { value: 'privacy', label: 'Privacy' },
    ],
    modelValue: 'preferences',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const preferences = canvas.getByRole('tab', { name: 'Preferences' })
    const privacy = canvas.getByRole('tab', { name: 'Privacy' })

    await step('the selected tab shows its panel', async () => {
      await expect(preferences).toHaveAttribute('aria-selected', 'true')
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Theme, language')
    })

    await step('the rail is vertical, so ArrowDown moves along it', async () => {
      preferences.focus()
      await userEvent.keyboard('{ArrowDown}')
      // Account is disabled, so focus lands on Privacy, not on it.
      await expect(privacy).toHaveFocus()
      await expect(privacy).toHaveAttribute('aria-selected', 'true')
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Decide what gets stored')
    })

    await step('the rail is one tab stop', async () => {
      await expect(privacy).toHaveAttribute('tabindex', '0')
      await expect(preferences).toHaveAttribute('tabindex', '-1')
    })
  },
}

/** Docked right — mirror of the default; the bar flips to the rail's other outer edge. */
export const Right: Story = {
  args: { placement: 'right' },
}

/** Icon beside label — the settings-sidebar shape. */
export const Icons: Story = {
  args: { tabs: SETTINGS.slice(0, 3), modelValue: 'account' },
}

/** `lg` scale — taller triggers, 14px labels. */
export const Large: Story = {
  args: { size: 'lg', tabs: SETTINGS.slice(0, 3) },
}

/** `xl` scale — tallest triggers, 18px labels, 24px icons. */
export const ExtraLarge: Story = {
  args: { size: 'xl', tabs: SETTINGS.slice(0, 3) },
}

/** A disabled tab is skipped by keyboard nav and can't be activated. */
export const DisabledTab: Story = {
  args: {
    tabs: [
      { value: 'preferences', label: 'Preferences' },
      { value: 'account', label: 'Account', disabled: true },
      { value: 'privacy', label: 'Privacy' },
    ],
    modelValue: 'preferences',
  },
}

/** Icon-only rail — no labels, so each `value` is the tab's accessible name. Triggers collapse to a square. */
export const IconRail: Story = {
  args: {
    size: 'xl',
    tabs: [
      { value: 'preferences', icon: 'mdi:cog-outline' },
      { value: 'account', icon: 'mdi:account-circle-outline' },
      { value: 'privacy', icon: 'mdi:shield-lock-outline' },
    ],
    modelValue: 'preferences',
  },
  render: args => ({
    components: { TrustyNavigationTabs },
    setup: () => ({ args }),
    template: `
      <TrustyNavigationTabs v-bind="args" style="background: var(--color-bg-lowered)">
        <template #preferences>${panel('Preferences', 'Theme, language, and the shortcuts you reach for most.')}</template>
        <template #account>${panel('Account', 'Your name, avatar, and the address we send receipts to.')}</template>
        <template #privacy>${panel('Privacy', 'Decide what gets stored and for how long.')}</template>
      </TrustyNavigationTabs>
    `,
  }),
}

/** Rail only — no panel slots. Drive content living outside the component via `v-model`. */
export const RailOnly: Story = {
  args: { tabs: SETTINGS, modelValue: 'account' },
  render: args => ({
    components: { TrustyNavigationTabs },
    setup: () => ({ args }),
    template: `
      <div style="inline-size: var(--size-xs); background: var(--color-bg-lowered); padding-block: var(--space-sm)">
        <TrustyNavigationTabs v-bind="args" />
      </div>
    `,
  }),
}
