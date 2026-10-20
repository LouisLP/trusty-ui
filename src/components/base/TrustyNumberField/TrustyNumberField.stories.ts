import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyNumberField from './TrustyNumberField.vue'

const meta = {
  title: 'Form/Controls/TrustyNumberField',
  component: TrustyNumberField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The plain numeric input. Reka's NumberField underneath provides clamping, keyboard stepping, and locale-aware parsing; on top sit 'precision', an optional decorative 'unit' suffix, and opt-in stepper buttons (off by default, which suits dense inspector panels). It's a layer-1 form control: 'invalid' and 'required' usually arrive via TrustyFormItem's field slot.

**Use it when**
- a form needs a typed numeric value.

**Don't use it for**
- coarse adjustment of a bounded value: use TrustySlider
`,
      },
    },
  },
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    precision: { control: 'number' },
    unit: { control: 'text' },
    steppers: { control: 'boolean' },
    inputDisabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    step: 1,
    placeholder: '0',
    disabled: false,
    required: false,
    invalid: false,
    steppers: false,
    inputDisabled: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 14rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyNumberField>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyNumberField },
    setup() {
      const model = ref<number | null>(null)
      return { args, model }
    },
    template: '<TrustyNumberField v-bind="args" v-model="model" aria-label="Quantity" />',
  }
}

// Default: a bare, type-only field — no steppers.
export const Default: Story = { render }

// Opt in to the +/- stepper buttons.
export const WithSteppers: Story = { render, args: { steppers: true, min: 0, max: 10 } }

// Manual entry disabled — the value can only be changed through the steppers.
export const StepperOnly: Story = { render, args: { steppers: true, inputDisabled: true, min: 0, max: 10 } }

export const Bounded: Story = { render, args: { min: 0, max: 10, step: 1 } }

// Decimals are first-class. `precision` caps fraction digits; typed values keep their precision (default is no rounding).
export const Decimals: Story = {
  render: args => ({
    components: { TrustyNumberField },
    setup: () => ({ args, model: ref<number | null>(1.5) }),
    template: '<TrustyNumberField v-bind="args" v-model="model" aria-label="Angle" />',
  }),
  args: { step: 0.1, precision: 3, steppers: true },
}

// A unit suffix labels the value.
export const WithUnit: Story = {
  render: args => ({
    components: { TrustyNumberField },
    setup: () => ({ args, model: ref<number | null>(0.0125) }),
    template: '<TrustyNumberField v-bind="args" v-model="model" aria-label="Tolerance" />',
  }),
  args: { unit: 'm', step: 0.001 },
}

export const Currency: Story = {
  render: args => ({
    components: { TrustyNumberField },
    setup: () => ({ args, model: ref<number | null>(9.99) }),
    template: '<TrustyNumberField v-bind="args" v-model="model" aria-label="Price" />',
  }),
  args: { step: 0.01, formatOptions: { style: 'currency', currency: 'EUR' } },
}
export const Invalid: Story = { render, args: { invalid: true } }
export const Disabled: Story = { render, args: { disabled: true } }
