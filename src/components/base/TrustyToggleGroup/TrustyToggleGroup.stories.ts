import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyToggleGroup from './TrustyToggleGroup.vue'

const meta = {
  title: 'Form/Controls/TrustyToggleGroup',
  component: TrustyToggleGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A row of toggle buttons acting as one control. 'single' keeps at most one pressed (radio-like, string v-model) and, once one is picked, re-clicking it keeps it pressed; 'multiple' allows any number (string-array v-model). Items take labels, icons, and per-item disabling.

**Use it when**
- a few mutually exclusive modes sit side by side in a toolbar: alignment, view mode, units ('single').
- a small set of independent filters reads as one control ('multiple').

**Don't use it for**
- a labelled choice in a form: use TrustyRadioGroup, or TrustySelect for longer lists
- one independent on/off button: use TrustyToggle
- swapping what a region shows: use TrustyTabs
`,
      },
    },
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
    disabled: { control: 'boolean' },
  },
  args: {
    type: 'single',
    disabled: false,
    items: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
    modelValue: 'center',
  },
} satisfies Meta<typeof TrustyToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Single select (radio-like) — at most one item on; re-clicking the pressed one keeps it on. */
export const Single: Story = {}

/** Multiple select — `v-model` is an array; any number can be on. */
export const Multiple: Story = {
  args: { type: 'multiple', modelValue: ['left', 'right'] },
}

/** Icon-only items — `value` becomes each item's accessible name. */
export const Icons: Story = {
  args: {
    items: [
      { value: 'bold', icon: 'mdi:format-bold' },
      { value: 'italic', icon: 'mdi:format-italic' },
      { value: 'underline', icon: 'mdi:format-underline' },
    ],
    type: 'multiple',
    modelValue: ['bold'],
  },
}

export const Disabled: Story = { args: { disabled: true } }
