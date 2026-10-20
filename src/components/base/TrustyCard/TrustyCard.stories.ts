import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustyBadge from '../TrustyBadge/TrustyBadge.vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyCheckbox from '../TrustyCheckbox/TrustyCheckbox.vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyNumberField from '../TrustyNumberField/TrustyNumberField.vue'
import TrustyRadioGroup from '../TrustyRadioGroup/TrustyRadioGroup.vue'
import TrustyToggleGroup from '../TrustyToggleGroup/TrustyToggleGroup.vue'
import TrustyCard from './TrustyCard.vue'

const meta = {
  title: 'Layout/TrustyCard',
  component: TrustyCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A static surface that groups related content under a heading. It draws the panel — surface, radius, padding, the rhythm between header and body — and nothing else: the card has no behaviour, no state, and no interaction of its own.

Three places to put content:

| Where | What goes there |
| --- | --- |
| \`title\` / \`description\` | the heading (an \`<h3>\`) and one line of prose about the group |
| \`actions\` slot | controls acting on the whole group, pinned to the end of the header row |
| default slot | the body — form controls, a table, a read-out, whatever the group is |

A titled card names its own \`<section>\` through \`aria-labelledby\`, which makes it a region assistive tech can jump to. An untitled one stays an anonymous \`<section>\` and adds no landmark noise.

The card sizes to its container: give it a width in your layout (a grid column, a flex track) rather than expecting one here.

**Use it when**
- a group of related controls or read-outs needs boxing off under a heading (a parameter block, a settings group, an inspector panel)
- several pieces of content share one header row that carries the actions for all of them

**Don't use it for**
- a group the user can fold away: use TrustyCollapsible, or TrustyAccordion for several of them
- a message about the current screen: use TrustyBanner, or TrustyAlert when the user must respond
- switching between panels of content: use TrustyTabs
- content that floats above the page: use TrustyPopover, TrustyHoverCard, or TrustyDialog
- the label, hint, and error wiring around a single control: that is TrustyFormItem's job, and it belongs *inside* the card's body
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Heading for the group (plain string). Omit for an untitled surface.' },
    description: { control: 'text', description: 'Optional line of prose under the heading.' },
  },
  args: {
    title: 'Title',
    description: 'Description will be shown here.',
  },
  // Stands in for a layout column; 24rem is the design's 384px.
  decorators: [() => ({ template: '<div style="max-inline-size: 24rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyCard>

export default meta
type Story = StoryObj<typeof meta>

/** A column of colour-grade fields, shared by the stories that show a real body. */
const GRADE_ROW = `
  <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
    <TrustyNumberField
      v-for="(wheel, index) in wheels"
      :key="wheel"
      v-model="levels[index]"
      :precision="3"
      :step="0.01"
      steppers
      :aria-label="wheel"
    />
  </div>
`

function grade() {
  return { wheels: ['Lift', 'Gamma', 'Gain'], levels: ref([0.000, 1.000, 1.000]) }
}

/** Heading and description alone — the plainest card there is. */
export const Default: Story = {}

/** No description: the heading sits straight on top of the body. */
export const TitleOnly: Story = { args: { description: undefined } }

/** Longer prose wraps, and the card grows with it. */
export const WithDescription: Story = {
  args: {
    title: 'Read-only content area',
    description: 'Interactive elements are not permitted here — no buttons, inputs, or switches. The exception is an action internal to a component, such as the copy button inside a code block.',
  },
}

/** The `actions` slot pins controls to the end of the header row. */
export const WithActions: Story = {
  args: { title: 'Colour Grade', description: undefined },
  render: args => ({
    components: { TrustyButton, TrustyCard },
    setup: () => ({ args }),
    template: `
      <TrustyCard v-bind="args">
        <template #actions>
          <TrustyButton variant="primary" size="sm" icon="ph:link" label="Label" />
        </template>
      </TrustyCard>
    `,
  }),
}

/** The card's real job: a parameter block. Grade fields in the body, a toggle group acting on all of them in the header. */
export const ParameterBlock: Story = {
  args: { title: 'Colour Grade', description: undefined },
  render: args => ({
    components: { TrustyCard, TrustyNumberField, TrustyToggleGroup },
    setup: () => ({
      args,
      ...grade(),
      view: ref('values'),
      views: [
        { value: 'values', icon: 'ph:code-block' },
        { value: 'links', icon: 'ph:link' },
      ],
    }),
    template: `
      <TrustyCard v-bind="args">
        <template #actions>
          <TrustyToggleGroup v-model="view" :items="views" />
        </template>
        ${GRADE_ROW}
      </TrustyCard>
    `,
  }),
}

/** A whole form group in the body: fields, checkboxes, a labelled radio group. The card supplies only the surface and the rhythm. */
export const WithFormContent: Story = {
  args: { title: 'Colour Grade', description: undefined },
  render: args => ({
    components: { TrustyButton, TrustyCard, TrustyCheckbox, TrustyFormItem, TrustyNumberField, TrustyRadioGroup },
    setup: () => ({
      args,
      ...grade(),
      allClips: ref(false),
      skinTones: ref(false),
      shown: ref('item-2'),
      options: [
        { value: 'item-1', label: 'Item 1' },
        { value: 'item-2', label: 'Item 2' },
        { value: 'item-3', label: 'Item 3' },
      ],
    }),
    template: `
      <TrustyCard v-bind="args">
        <template #actions>
          <TrustyButton variant="primary" size="sm" icon="ph:link" label="Label" />
        </template>
        ${GRADE_ROW}
        <div style="display: flex; gap: var(--space-md);">
          <TrustyCheckbox v-model="allClips" label="Apply to all clips" />
          <TrustyCheckbox v-model="skinTones" label="Protect skin tones" />
        </div>
        <TrustyFormItem label="Show" group>
          <template #default="{ field }">
            <TrustyRadioGroup v-bind="field" v-model="shown" :options="options" size="sm" />
          </template>
        </TrustyFormItem>
      </TrustyCard>
    `,
  }),
}

/** Header row and nothing else: a title with the controls that act on whatever it names. */
export const HeaderOnly: Story = {
  args: { title: 'Render Queue', description: undefined },
  render: args => ({
    components: { TrustyButton, TrustyCard },
    setup: () => ({ args }),
    template: `
      <TrustyCard v-bind="args">
        <template #actions>
          <TrustyButton variant="primary" icon="ph:play" aria-label="Run" />
          <TrustyButton variant="secondary" icon="ph:stop" aria-label="Stop" />
        </template>
      </TrustyCard>
    `,
  }),
}

/** Untitled: just a surface for the body. It stays an anonymous `<section>`, so it adds no landmark. */
export const Untitled: Story = {
  args: { title: undefined, description: undefined },
  render: args => ({
    components: { TrustyCard, TrustyNumberField },
    setup: () => ({ args, ...grade() }),
    template: `
      <TrustyCard v-bind="args">
        ${GRADE_ROW}
      </TrustyCard>
    `,
  }),
}

/** A titled card is a region named by its own heading, and the controls in its header keep their own names and keyboard paths. */
export const IsALabelledRegion: Story = {
  args: { title: 'Export Settings', description: undefined },
  render: args => ({
    components: { TrustyButton, TrustyCard },
    setup: () => ({ args }),
    template: `
      <TrustyCard v-bind="args">
        <template #actions>
          <TrustyButton variant="ghost" size="sm" icon="ph:pencil-simple" aria-label="Edit settings" />
        </template>
      </TrustyCard>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the card is a region named by its heading', async () => {
      await expect(canvas.getByRole('region', { name: 'Export Settings' })).toBeVisible()
    })

    await step('the heading is an h3', async () => {
      await expect(canvas.getByRole('heading', { level: 3, name: 'Export Settings' })).toBeVisible()
    })

    await step('the header action keeps its own accessible name and is reachable by keyboard', async () => {
      const edit = canvas.getByRole('button', { name: 'Edit settings' })
      await expect(edit).toBeVisible()
      edit.focus()
      await expect(edit).toHaveFocus()
    })
  },
}

/**
 * Every card component ever written owes a debt to the [A11Y Style Guide's card](https://a11y-style-guide.com/style-guide/section-cards.html),
 * whose demo has been fronted by a furious halved bell pepper since roughly the dawn of time. Ours is
 * an Iconify glyph rather than a photograph, since `TrustyIcon` takes any `collection:icon` name.
 *
 * Beyond the joke it shows a media card: a thumbnail band in the body, badges under it, and the whole
 * thing still one titled region.
 */
export const AngryPepper: Story = {
  args: { title: 'Card', description: 'A11Y Style Guide' },
  render: args => ({
    components: { TrustyBadge, TrustyCard, TrustyIcon },
    setup: () => ({ args }),
    template: `
      <TrustyCard v-bind="args">
        <template #actions>
          <TrustyIcon name="noto:enraged-face" size="lg" />
        </template>
        <div style="display: grid; place-items: center; padding-block: var(--space-md); font-size: 6rem; background-color: var(--color-bg-lowered); border-radius: var(--radius-xs);">
          <TrustyIcon name="openmoji:bell-pepper" />
        </div>
        <div style="display: flex; gap: var(--space-xs);">
          <TrustyBadge label="Tech" variant="info" />
          <TrustyBadge label="jQuery" />
          <TrustyBadge label="Spicy" variant="error" icon="ph:warning" />
        </div>
      </TrustyCard>
    `,
  }),
}
