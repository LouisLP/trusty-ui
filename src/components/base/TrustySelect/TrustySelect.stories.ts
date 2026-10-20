import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustySelect from './TrustySelect.vue'

const meta = {
  title: 'Form/Controls/TrustySelect',
  component: TrustySelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single-value picker over a short, known list. The trigger shows the selection (or a placeholder) and opens a dropdown of options. It's a layer-1 form control.

**Use it when**
- choosing sets a value and users can scan the whole list without searching (roughly ten options or fewer)
- each option reads faster with a leading icon — give the item an **icon**, and the trigger mirrors it once selected.
- the pick should read as text rather than a field — in a toolbar or a compact form row — set **variant** to \`ghost\` and the trigger drops its field chrome.

**Don't use it for**
- long or runtime-loaded lists that want type-to-filter: use TrustyCombobox
- menus of commands: use TrustyDropdownMenu
- a handful of options where seeing them all at once helps the decision: consider TrustyRadioGroup
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    ariaLabel: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    variant: { control: 'inline-radio', options: ['default', 'ghost'] },
    items: { control: 'object' },
  },
  args: {
    placeholder: 'Favourite team member…',
    ariaLabel: 'Team member',
    disabled: false,
    required: false,
    invalid: false,
    variant: 'default',
    items: [
      { value: 'louis', label: 'Louis' },
      { value: 'francis', label: 'Francis' },
      { value: 'katya', label: 'Katya' },
      { value: 'adnan', label: 'Adnan (unavailable)', disabled: true },
      { value: 'maksym', label: 'Maksym' },
    ],
  },
  // The trigger fills its container, so the wrapper sizes it; padding gives the portalled list room inside the docs frame.
  decorators: [() => ({ template: '<div style="padding: 4rem; max-inline-size: 18rem; margin-inline: auto;"><story /></div>' })],
} satisfies Meta<typeof TrustySelect>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustySelect },
    setup() {
      const model = ref<string>()
      return { args, model }
    },
    template: `<TrustySelect v-bind="args" v-model="model" />`,
  }
}

/** Default: placeholder until a value is chosen, checkmark marks the selection. */
export const Default: Story = { render }

/** Icons — an item's optional `icon` leads its row, and the trigger echoes the selected one. */
export const WithIcons: Story = {
  args: {
    placeholder: 'Choose a view…',
    ariaLabel: 'View',
    items: [
      { value: 'list', label: 'List', icon: 'ph:list' },
      { value: 'tiles', label: 'Tiles', icon: 'ph:squares-four' },
      { value: 'cards', label: 'Cards', icon: 'ph:cards' },
      { value: 'timeline', label: 'Timeline (soon)', icon: 'ph:clock-counter-clockwise', disabled: true },
    ],
  },
  render,
}

/** Pre-selected value via v-model. */
export const Preselected: Story = {
  render: args => ({
    components: { TrustySelect },
    setup() {
      const model = ref('louis')
      return { args, model }
    },
    template: `<TrustySelect v-bind="args" v-model="model" />`,
  }),
}

/** Disabled — the trigger renders but the list never opens. */
export const Disabled: Story = { args: { disabled: true }, render }

/** Invalid — errored border, usually driven by TrustyFormItem's slot props. */
export const Invalid: Story = { args: { invalid: true }, render }

/** Ghost — no fill or visible border; the trigger hugs its value so the pick reads as text. */
export const Ghost: Story = { ...Preselected, args: { variant: 'ghost' } }

/** Ghost in context — under a form label, and in a toolbar with its icon, placeholder, invalid and disabled states. */
export const GhostInContext: Story = {
  render: args => ({
    components: { TrustyFormItem, TrustySelect },
    setup() {
      const owner = ref('louis')
      const view = ref('tiles')
      const views = [
        { value: 'list', label: 'List', icon: 'ph:list' },
        { value: 'tiles', label: 'Tiles', icon: 'ph:squares-four' },
      ]
      return { args, owner, view, views }
    },
    template: `
      <div style="display: grid; gap: 1.5rem; inline-size: max-content;">
        <TrustyFormItem label="Owner" required>
          <template #default="{ field }">
            <TrustySelect v-bind="{ ...args, ...field }" v-model="owner" />
          </template>
        </TrustyFormItem>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;">
          <TrustySelect variant="ghost" :items="views" v-model="view" aria-label="View" />
          <TrustySelect variant="ghost" :items="args.items" aria-label="Assignee" />
          <TrustySelect variant="ghost" :items="args.items" model-value="louis" invalid aria-label="Reviewer" />
          <TrustySelect variant="ghost" :items="args.items" model-value="louis" disabled aria-label="Approver" />
        </div>
      </div>`,
  }),
  args: { variant: 'ghost' },
}
