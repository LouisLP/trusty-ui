import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyStepper from './TrustyStepper.vue'

const meta = {
  title: 'Navigation/TrustyStepper',
  component: TrustyStepper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Progress through a task that runs over several steps. Each step shows its number — or an icon — with a title and an optional description, and 'v-model' carries the step the user is on, 1-based. By default progress is linear: only the steps already reached and the one straight after can be picked, and the rest read as locked. The strip shows progress and moves between steps; the content of each step lives outside the component, keyed off 'v-model'.

**Use it when**
- one task splits into ordered steps and the user needs to see where they are and how much is left
- a form is long enough to break into stages the user submits at the end

**Don't use it for**
- peer views the user flips between in any order: use TrustyTabs
- paging through a list of results: use TrustyPagination
- a single yes/no stage, or one that fits on one screen: just show the form
- a read-only status timeline nobody navigates: render a plain list
`,
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  args: {
    orientation: 'horizontal',
    linear: true,
    modelValue: 2,
    steps: [
      { title: 'Details', description: 'Name and email' },
      { title: 'Address', description: 'Where we ship' },
      { title: 'Payment', description: 'Card or invoice' },
      { title: 'Review', description: 'Check and confirm' },
    ],
  },
  render: args => ({
    components: { TrustyStepper },
    setup: () => ({ args }),
    template: `<div style="inline-size: var(--size-lg)"><TrustyStepper v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof TrustyStepper>

export default meta
type Story = StoryObj<typeof meta>

/** The current step and the ones behind it are filled; step 3 is reachable, and the steps beyond it stay locked. */
export const Default: Story = {}

/** The rail runs down the side — arrow keys go up/down. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: args => ({
    components: { TrustyStepper },
    setup: () => ({ args }),
    template: `<div style="inline-size: var(--size-2xs)"><TrustyStepper v-bind="args" /></div>`,
  }),
}

/** Titles alone, when the step names carry the whole story. */
export const TitlesOnly: Story = {
  args: {
    steps: [
      { title: 'Details' },
      { title: 'Address' },
      { title: 'Payment' },
      { title: 'Review' },
    ],
  },
}

/** Icons replace the numbers when each step has a recognisable subject. */
export const Icons: Story = {
  args: {
    modelValue: 2,
    steps: [
      { title: 'Details', description: 'Name and email', icon: 'ph:info' },
      { title: 'Settings', description: 'Pick your options', icon: 'ph:gear' },
      { title: 'Review', description: 'Check and confirm', icon: 'ph:check' },
    ],
  },
}

/** A yellow (warning) dot marks a step holding something the user has to come back to. */
export const Warning: Story = {
  args: {
    modelValue: 2,
    steps: [
      { title: 'Details', description: 'Name and email' },
      { title: 'Address', description: 'Postcode missing', warning: true },
      { title: 'Payment', description: 'Card or invoice' },
      { title: 'Review', description: 'Check and confirm' },
    ],
  },
}

/** `linear: false` — every step is reachable, in any order. */
export const NonLinear: Story = {
  args: { linear: false, modelValue: 1 },
}

/** A step that can never be reached, wherever progress has got to. */
export const DisabledStep: Story = {
  args: {
    linear: false,
    modelValue: 1,
    steps: [
      { title: 'Details', description: 'Name and email' },
      { title: 'Address', description: 'Where we ship' },
      { title: 'Payment', description: 'Invoiced monthly', disabled: true },
      { title: 'Review', description: 'Check and confirm' },
    ],
  },
}

/** Driven from outside: the buttons move the same `v-model` the strip does. */
export const Controlled: Story = {
  render: args => ({
    components: { TrustyButton, TrustyStepper },
    setup: () => ({ args }),
    data: () => ({ step: 1 }),
    template: `
      <div style="display: grid; gap: var(--space-lg); inline-size: var(--size-lg)">
        <TrustyStepper v-bind="args" v-model="step" />
        <div style="display: flex; gap: var(--space-sm); justify-content: center">
          <TrustyButton
            variant="secondary"
            label="Back"
            leading-icon="ph:caret-left"
            :disabled="step === 1"
            @click="step -= 1"
          />
          <TrustyButton
            label="Next"
            trailing-icon="ph:caret-right"
            :disabled="step === args.steps.length"
            @click="step += 1"
          />
        </div>
      </div>
    `,
  }),
}
