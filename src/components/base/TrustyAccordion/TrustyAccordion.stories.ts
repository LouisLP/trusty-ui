import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { DefineComponent } from 'vue'
import { ref } from 'vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustyCollapsible from '../TrustyCollapsible/TrustyCollapsible.vue'
import TrustyNumberField from '../TrustyNumberField/TrustyNumberField.vue'
import TrustySelect from '../TrustySelect/TrustySelect.vue'
import TrustySwitch from '../TrustySwitch/TrustySwitch.vue'
import TrustyAccordion from './TrustyAccordion.vue'

// TrustyAccordion is generic over its item values, which Vue types as a bare call signature — Storybook's Meta only accepts object-shaped component types. Pin `T = string` and cast to a concrete component; runtime is unaffected.
type TrustyAccordionStory = DefineComponent<Parameters<typeof TrustyAccordion<string>>[0]>
const TrustyAccordionConcrete = TrustyAccordion as unknown as TrustyAccordionStory

// A settings group per panel — the canonical use. `exposure` and `focus` are filled by slots; `about` carries only a description, and needs no slot.
const ITEMS = [
  { value: 'exposure', label: 'Exposure', icon: 'ph:aperture' as const },
  { value: 'focus', label: 'Focus', icon: 'ph:crosshair-simple' as const },
  { value: 'stabilization', label: 'Stabilization', icon: 'ph:hand' as const },
  { value: 'sensor-cleaning', label: 'Sensor Cleaning', icon: 'ph:broom' as const, disabled: true },
  {
    value: 'about',
    label: 'About this camera',
    icon: 'ph:info' as const,
    description: 'A full-frame mirrorless body with a 35mm f/1.4 prime. Bought March 2024; sensor last cleaned six weeks ago.',
  },
]

const FOCUS_MODES = [
  { value: 'single', label: 'Single' },
  { value: 'continuous', label: 'Continuous' },
  { value: 'manual', label: 'Manual' },
]

const meta = {
  title: 'Layout/TrustyAccordion',
  component: TrustyAccordionConcrete,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A vertically stacked set of collapsible panels on their own surface.

Each item's \`value\` names both what \`v-model\` reports and the slot that fills that panel's body. The item's \`label\` and \`icon\` render in the header; the body is the item's \`description\` followed by that slot, and nothing else — so an item that is only prose needs no slot, and an item that is only controls needs no description.

\`single\` (the default) keeps at most one panel open and lets you close it again; \`multiple\` reports an array. Every header is a \`<button>\` inside an \`<h3>\`: Space and Enter toggle, arrow keys walk the headers, Home and End jump to the ends.

**Use it when**
- several related groups share one surface and not all of them need to be visible at once: settings categories, parameter groups, configuration sections.

**Don't use it for**
- one standalone collapsible area inside another component — no surface, no group behaviour: use TrustyCollapsible
- swapping one region between peer views, where exactly one is always visible: use TrustyTabs
- content the user always needs: keep it outside the accordion
`,
      },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
    disabled: { control: 'boolean' },
  },
  args: {
    items: ITEMS,
    type: 'single',
    disabled: false,
  },
  decorators: [() => ({ template: '<div style="inline-size: 21.5rem;"><story /></div>' })],
  // `modelValue` seeds a local ref instead of staying bound, so the story stays interactive rather than frozen on the arg.
  render: (args) => {
    const { modelValue, ...rest } = args
    return {
      components: { TrustyAccordion, TrustyFormItem, TrustyNumberField, TrustySelect, TrustySwitch },
      setup: () => ({
        rest,
        open: ref(modelValue),
        iso: ref(400),
        compensation: ref(-0.3),
        focusMode: ref('continuous'),
        stabilized: ref(true),
        focusModes: FOCUS_MODES,
      }),
      template: `
        <TrustyAccordion v-bind="rest" v-model="open">
          <template #exposure>
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              <TrustyFormItem label="ISO">
                <template #default="{ field }">
                  <TrustyNumberField v-model="iso" :min="100" :max="25600" :step="100" v-bind="field" />
                </template>
              </TrustyFormItem>
              <TrustyFormItem label="Exposure compensation">
                <template #default="{ field }">
                  <TrustyNumberField v-model="compensation" :min="-3" :max="3" :step="0.3" :precision="1" unit="EV" v-bind="field" />
                </template>
              </TrustyFormItem>
            </div>
          </template>

          <template #focus>
            <TrustyFormItem label="Focus mode" hint="Manual hands focus to the lens ring.">
              <template #default="{ field }">
                <TrustySelect v-model="focusMode" :items="focusModes" v-bind="field" />
              </template>
            </TrustyFormItem>
          </template>

          <template #stabilization>
            <TrustySwitch v-model="stabilized" label="In-body stabilization" />
          </template>
        </TrustyAccordion>
      `,
    }
  },
} satisfies Meta<typeof TrustyAccordionConcrete>

export default meta
type Story = StoryObj<typeof meta>

/** Every panel closed — how the group first renders. */
export const Default: Story = {}

/** One panel open; the model is that item's `value`. */
export const OpenPanel: Story = { args: { modelValue: 'exposure' } }

/** `about` carries only a `description`, so its body is prose with no slot — and no second header inside the panel. */
export const DescriptionOnly: Story = { args: { modelValue: 'about' } }

/** `multiple` lets any number stand open at once; the model is an array. */
export const Multiple: Story = {
  args: { type: 'multiple', modelValue: ['exposure', 'stabilization'] },
}

/** Group-level `disabled` locks every header; per-item `disabled` locks one — as `sensor-cleaning` is throughout. */
export const Disabled: Story = { args: { disabled: true } }

/** Labels only: no icons, no descriptions, bodies filled entirely by slots. */
export const LabelsOnly: Story = {
  args: {
    items: [
      { value: 'video', label: 'Video' },
      { value: 'audio', label: 'Audio' },
      { value: 'subtitles', label: 'Subtitles' },
    ],
    modelValue: 'video',
  },
  render: (args) => {
    const { modelValue, ...rest } = args
    return {
      components: { TrustyAccordion, TrustyFormItem, TrustyNumberField },
      setup: () => ({ rest, open: ref(modelValue), bitrate: ref(50), delay: ref(0) }),
      template: `
        <TrustyAccordion v-bind="rest" v-model="open">
          <template #video>
            <TrustyFormItem label="Bitrate">
              <template #default="{ field }">
                <TrustyNumberField v-model="bitrate" :min="1" :max="400" unit="Mbps" v-bind="field" />
              </template>
            </TrustyFormItem>
          </template>
          <template #audio>
            <TrustyFormItem label="Audio offset">
              <template #default="{ field }">
                <TrustyNumberField v-model="delay" :min="-500" :max="500" :step="10" unit="ms" v-bind="field" />
              </template>
            </TrustyFormItem>
          </template>
          <template #subtitles>No subtitle track attached.</template>
        </TrustyAccordion>
      `,
    }
  },
}

/** The two components together: an accordion panel groups the sections, and a `TrustyCollapsible` inside it tucks away the fields most operators skip. */
export const WithNestedCollapsible: Story = {
  args: {
    items: [
      { value: 'network', label: 'Network', icon: 'ph:link' as const },
      { value: 'logging', label: 'Logging', icon: 'ph:terminal-window' as const },
    ],
    modelValue: 'network',
  },
  render: (args) => {
    const { modelValue, ...rest } = args
    return {
      components: { TrustyAccordion, TrustyCollapsible, TrustyFormItem, TrustyNumberField, TrustySelect },
      setup: () => ({
        rest,
        open: ref(modelValue),
        port: ref(502),
        timeout: ref(30),
        level: ref('warning'),
        levels: [
          { value: 'error', label: 'Error' },
          { value: 'warning', label: 'Warning' },
          { value: 'debug', label: 'Debug' },
        ],
      }),
      template: `
        <TrustyAccordion v-bind="rest" v-model="open">
          <template #network>
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              <TrustyFormItem label="Port">
                <template #default="{ field }">
                  <TrustyNumberField v-model="port" :min="1" :max="65535" v-bind="field" />
                </template>
              </TrustyFormItem>
              <TrustyCollapsible description="Advanced">
                <TrustyFormItem label="Timeout">
                  <template #default="{ field }">
                    <TrustyNumberField v-model="timeout" :min="1" :max="600" unit="s" v-bind="field" />
                  </template>
                </TrustyFormItem>
              </TrustyCollapsible>
            </div>
          </template>

          <template #logging>
            <TrustyFormItem label="Level">
              <template #default="{ field }">
                <TrustySelect v-model="level" :items="levels" v-bind="field" />
              </template>
            </TrustyFormItem>
          </template>
        </TrustyAccordion>
      `,
    }
  },
}
