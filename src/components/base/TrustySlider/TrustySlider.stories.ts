import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustySlider from './TrustySlider.vue'

const meta = {
  title: 'Form/Controls/TrustySlider',
  component: TrustySlider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A drag-to-set numeric control. The v-model is an array with one entry per thumb, so a two-entry array renders a range slider; single-thumb sliders can show a live value readout.

The thumb is what assistive tech focuses, so \`aria-label\`, \`id\` and \`aria-describedby\` land on it; on a range slider they label the pair as a group instead.

**Use it when**
- the value is bounded and roughly right is good enough: speed, opacity, volume.

**Don't use it for**
- values where the exact number matters: typing into TrustyNumberField is faster
`,
      },
    },
  },
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    disabled: { control: 'boolean' },
    showValue: { control: 'boolean' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showValue: true,
    modelValue: [50],
  },
  // A bare control has no visible label; in an app TrustyFormItem supplies one. aria-label reaches the thumb.
  render: args => ({
    components: { TrustySlider },
    setup: () => ({ args }),
    template: '<TrustySlider v-bind="args" aria-label="Speed" />',
  }),
  // Give the horizontal slider a sensible width to stretch into.
  decorators: [() => ({ template: '<div style="inline-size: 18rem;"><story /></div>' })],
} satisfies Meta<typeof TrustySlider>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {}
export const Range: Story = { args: { modelValue: [20, 80] } }
export const Stepped: Story = { args: { step: 10, modelValue: [30] } }
export const Disabled: Story = { args: { disabled: true } }
export const WithoutValue: Story = { args: { showValue: false } }
