import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyNumberField from '../../base/TrustyNumberField/TrustyNumberField.vue'
import TrustyRadioGroup from '../../base/TrustyRadioGroup/TrustyRadioGroup.vue'
import TrustySecretInput from '../../base/TrustySecretInput/TrustySecretInput.vue'
import TrustyTextInput from '../../base/TrustyTextInput/TrustyTextInput.vue'
import TrustyFormItem from './TrustyFormItem.vue'

const meta = {
  title: 'Form/Layout/TrustyFormItem',
  component: TrustyFormItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Layer 2 of the form system: wraps one control with its label, hint, error message, and required marker, generates the ids, and hands the control everything it needs through the 'field' scoped slot. Spread it onto the control: v-bind="field". Set 'group' for radio or checkbox groups (the label then wires via aria-labelledby), and 'controlId' when TrustyForm's error summary needs to link to the field.

**Use it when**
- wrapping every layer-1 control (TrustyTextInput, TrustyNumberField, TrustyRadioGroup and friends) in a form. Don't wire labels or aria attributes by hand; spreading 'field' does it.

**Don't use it for**
- a control that needs no label, hint, or error: use the control on its own, that is layer 1
- the error summary, field spacing, or submit: those belong to TrustyForm, layer 3
- wiring 'for'/'aria-describedby' by hand: spread 'field' onto the control instead
`,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    labelTooltip: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    group: { control: 'boolean' },
  },
  args: {
    label: 'Email address',
    labelTooltip: '',
    hint: 'We will only use this to contact you.',
    error: '',
    required: false,
    group: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 24rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyFormItem>

export default meta
type Story = StoryObj<typeof meta>

// ── Single text control: the baseline. `field` carries id + aria wiring. ──
export const WithTextInput: Story = {
  render: args => ({
    components: { TrustyFormItem, TrustyTextInput },
    setup: () => ({ args, model: ref('') }),
    template: `
      <TrustyFormItem v-bind="args">
        <template #default="{ field }">
          <TrustyTextInput v-model="model" type="email" placeholder="name@example.com" v-bind="field" />
        </template>
      </TrustyFormItem>`,
  }),
}

// ── Label + control only — no hint, no error. ──
export const LabelOnly: Story = {
  ...WithTextInput,
  args: { hint: '', label: 'Display name' },
}

// ── Required marker (the asterisk) + native required on the control. ──
export const Required: Story = {
  ...WithTextInput,
  args: { required: true },
}

// ── Hint with no error: the helper text guides before anything goes wrong. ──
export const WithHint: Story = {
  ...WithTextInput,
  args: { label: 'Username', hint: '3-20 characters, letters and numbers only.' },
}

// ── Info icon next to the label; hovering it opens a tooltip with the hint. ──
export const WithLabelTooltip: Story = {
  ...WithTextInput,
  args: {
    label: 'API key',
    labelTooltip: 'Found under Settings → Tokens. Rotate it if it leaks.',
    hint: '',
  },
}

// ── Error state: message announced via role="alert", control reads invalid. ──
export const WithError: Story = {
  ...WithTextInput,
  args: { error: 'Enter a valid email address.', required: true },
}

// ── Error without a hint (error replaces guidance once validation fails). ──
export const ErrorNoHint: Story = {
  ...WithTextInput,
  args: { hint: '', error: 'This field is required.', required: true },
}

// ── Wrapping a number control — same contract, different widget. ──
export const WithNumberField: Story = {
  args: { label: 'Frame rate', hint: 'Frames per second.', required: false },
  render: args => ({
    components: { TrustyFormItem, TrustyNumberField },
    setup: () => ({ args, model: ref<number | null>(45) }),
    template: `
      <TrustyFormItem v-bind="args">
        <template #default="{ field }">
          <TrustyNumberField v-model="model" :min="0" :max="180" v-bind="field" />
        </template>
      </TrustyFormItem>`,
  }),
}

// ── Wrapping the masked secret control. ──
export const WithSecretInput: Story = {
  args: { label: 'API key', hint: 'Found under Settings → Tokens.', required: true },
  render: args => ({
    components: { TrustyFormItem, TrustySecretInput },
    setup: () => ({ args, model: ref('') }),
    template: `
      <TrustyFormItem v-bind="args">
        <template #default="{ field }">
          <TrustySecretInput v-model="model" v-bind="field" />
        </template>
      </TrustyFormItem>`,
  }),
}

// ── Group mode: label becomes an aria-labelledby target for the radio group. ──
export const GroupControl: Story = {
  args: {
    label: 'Shipping speed',
    hint: 'Faster options cost more.',
    group: true,
    required: true,
  },
  render: args => ({
    components: { TrustyFormItem, TrustyRadioGroup },
    setup: () => ({
      args,
      model: ref('standard'),
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'express', label: 'Express' },
      ],
    }),
    template: `
      <TrustyFormItem v-bind="args">
        <template #default="{ field }">
          <TrustyRadioGroup v-model="model" :options="options" v-bind="field" />
        </template>
      </TrustyFormItem>`,
  }),
}

// ── Several items stacked: shows real spacing + a mix of states together. ──
export const Stacked: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    components: { TrustyFormItem, TrustyTextInput, TrustyNumberField, TrustyRadioGroup },
    setup: () => ({
      name: ref(''),
      speed: ref<number | null>(null),
      mode: ref('auto'),
      modes: [
        { value: 'auto', label: 'Automatic' },
        { value: 'manual', label: 'Manual' },
      ],
    }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <TrustyFormItem label="Project name" hint="Shown in the media browser." required>
          <template #default="{ field }">
            <TrustyTextInput v-model="name" v-bind="field" />
          </template>
        </TrustyFormItem>
        <TrustyFormItem label="Frame rate" error="Must be greater than 0." required>
          <template #default="{ field }">
            <TrustyNumberField v-model="speed" :min="0" v-bind="field" />
          </template>
        </TrustyFormItem>
        <TrustyFormItem label="Exposure mode" group>
          <template #default="{ field }">
            <TrustyRadioGroup v-model="mode" :options="modes" orientation="horizontal" v-bind="field" />
          </template>
        </TrustyFormItem>
      </div>`,
  }),
}
