import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustyNumberField from '../TrustyNumberField/TrustyNumberField.vue'
import TrustySelect from '../TrustySelect/TrustySelect.vue'
import TrustySwitch from '../TrustySwitch/TrustySwitch.vue'
import TrustyTextInput from '../TrustyTextInput/TrustyTextInput.vue'
import TrustyCollapsible from './TrustyCollapsible.vue'

const meta = {
  title: 'Layout/TrustyCollapsible',
  component: TrustyCollapsible,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
One collapsible area, for use inside another component — a group of related inputs, form fields, or settings that need not be visible by default. It brings no surface of its own and knows nothing about siblings, so it drops into whatever panel hosts it and several of them open independently.

The \`description\` is the trigger's text; the default slot holds the revealed content. The header is a \`<button>\`, so Space and Enter toggle it, and the marker turns from right to down as it opens.

Leave \`open\` unbound to let it manage itself, or bind \`v-model:open\` to drive it from outside — including to start it open.

**Use it when**
- one group of related inputs, fields, or settings inside another component need not be visible by default.
- several such areas must open and close independently of one another.

**Don't use it for**
- a stack of panels on their own surface where at most one should stand open: use TrustyAccordion
- content the user must see to finish the task: revealing it is one click they may never make
`,
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    description: 'Details',
    open: false,
    disabled: false,
  },
  decorators: [() => ({ template: '<div style="inline-size: 21.5rem;"><story /></div>' })],
  // `open` seeds a local ref instead of staying bound, so the story toggles.
  render: (args) => {
    const { open, ...rest } = args
    return {
      components: { TrustyCollapsible, TrustyFormItem, TrustyTextInput },
      setup: () => ({ rest, isOpen: ref(open), name: ref('sony-fe-35-f14') }),
      template: `
        <TrustyCollapsible v-bind="rest" v-model:open="isOpen">
          <TrustyFormItem label="Lens name">
            <template #default="{ field }">
              <TrustyTextInput v-model="name" v-bind="field" />
            </template>
          </TrustyFormItem>
        </TrustyCollapsible>
      `,
    }
  },
} satisfies Meta<typeof TrustyCollapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Open: Story = { args: { open: true } }

/** Locked: the trigger dims and stops toggling, so the fields stay hidden. */
export const Disabled: Story = { args: { disabled: true } }

/** The everyday use — hiding the fields most operators never touch, so the form above stays short. The controls are ordinary `TrustyFormItem` fields; the collapsible adds no surface or indentation of its own. */
export const OverFormFields: Story = {
  args: { description: 'Advanced', open: true },
  render: (args) => {
    const { open, ...rest } = args
    return {
      components: { TrustyCollapsible, TrustyFormItem, TrustyNumberField, TrustyTextInput },
      setup: () => ({
        rest,
        isOpen: ref(open),
        host: ref('192.168.1.42'),
        timeout: ref(30),
        retries: ref(3),
      }),
      template: `
        <div style="display: flex; flex-direction: column; gap: var(--space-md);">
          <TrustyFormItem label="Controller host" hint="IP address or hostname.">
            <template #default="{ field }">
              <TrustyTextInput v-model="host" v-bind="field" />
            </template>
          </TrustyFormItem>

          <TrustyCollapsible v-bind="rest" v-model:open="isOpen">
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              <TrustyFormItem label="Timeout">
                <template #default="{ field }">
                  <TrustyNumberField v-model="timeout" :min="1" :max="600" unit="s" v-bind="field" />
                </template>
              </TrustyFormItem>
              <TrustyFormItem label="Retries">
                <template #default="{ field }">
                  <TrustyNumberField v-model="retries" :min="0" :max="10" v-bind="field" />
                </template>
              </TrustyFormItem>
            </div>
          </TrustyCollapsible>
        </div>
      `,
    }
  },
}

/** Several in a row, each minding its own state — the pattern for a settings panel. Use `TrustyAccordion` instead when only one section should stand open. */
export const Stacked: Story = {
  render: () => ({
    components: { TrustyCollapsible, TrustyFormItem, TrustyNumberField, TrustySelect, TrustySwitch },
    setup: () => ({
      exposureOpen: ref(true),
      iso: ref(400),
      focusMode: ref('continuous'),
      stabilized: ref(true),
      focusModes: [
        { value: 'single', label: 'Single' },
        { value: 'continuous', label: 'Continuous' },
        { value: 'manual', label: 'Manual' },
      ],
    }),
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        <TrustyCollapsible v-model:open="exposureOpen" description="Exposure">
          <TrustyFormItem label="ISO">
            <template #default="{ field }">
              <TrustyNumberField v-model="iso" :min="100" :max="25600" :step="100" v-bind="field" />
            </template>
          </TrustyFormItem>
        </TrustyCollapsible>

        <TrustyCollapsible description="Focus">
          <TrustyFormItem label="Focus mode">
            <template #default="{ field }">
              <TrustySelect v-model="focusMode" :items="focusModes" v-bind="field" />
            </template>
          </TrustyFormItem>
        </TrustyCollapsible>

        <TrustyCollapsible description="Stabilization">
          <TrustySwitch v-model="stabilized" label="In-body stabilization" />
        </TrustyCollapsible>
      </div>
    `,
  }),
}
