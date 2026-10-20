import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustyColorInput from './TrustyColorInput.vue'

const meta = {
  title: 'Form/Controls/TrustyColorInput',
  component: TrustyColorInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A hex colour field with a swatch, a transparency slider, and a picker behind the swatch. As a layer-1 control it owns just the widget: no label, hint, or error text of its own, and 'invalid'/'required' usually arrive through TrustyFormItem's field slot.

The value commits on blur or Enter as \`#RRGGBB\` (or \`#RRGGBBAA\` below full opacity); empty is \`''\`. Text that isn't hex commits as typed, so the consumer's validator can flag it. Clicking the swatch opens a saturation/brightness area and a hue slider; a pick commits straight away and keeps the current transparency.

**Use it when**
- a form needs one colour, typed as hex or picked visually, with optional transparency.

**Don't use it for**
- free text: use TrustyTextInput
- picking from a fixed palette of colours: use TrustyRadioGroup or TrustySelect
`,
      },
    },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 16.25rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyColorInput>

export default meta
type Story = StoryObj<typeof meta>

function withValue(initial: string) {
  return (args: Record<string, unknown>) => ({
    components: { TrustyColorInput },
    setup() {
      const model = ref(initial)
      return { args, model }
    },
    template: '<TrustyColorInput v-bind="args" v-model="model" aria-label="Colour" />',
  })
}

export const Default: Story = { render: withValue('') }
export const Filled: Story = { render: withValue('#752BD4') }
export const Translucent: Story = { render: withValue('#752BD480') }
export const Invalid: Story = { render: withValue('#MBSFGS'), args: { invalid: true } }
export const Disabled: Story = { render: withValue('#752BD4'), args: { disabled: true } }

/** In a field: the label, required marker and error come from TrustyFormItem, the validation from the consumer. */
export const InAField: Story = {
  render: args => ({
    components: { TrustyColorInput, TrustyFormItem },
    setup() {
      const model = ref('#MBSFGS')
      const isHex = (value: string) => /^#(?:[\dA-F]{6}|[\dA-F]{8})$/.test(value)
      return { args, model, isHex }
    },
    template: `
      <TrustyFormItem label="Label" required :error="model && !isHex(model) ? 'Invalid color - must be hex color' : undefined">
        <template #default="{ field }">
          <TrustyColorInput v-bind="{ ...args, ...field }" v-model="model" />
        </template>
      </TrustyFormItem>
    `,
  }),
}

/** Typing commits on blur; a valid colour brings up the swatch and the alpha slider. */
export const TypesAColour: Story = {
  render: withValue(''),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Colour' })

    await userEvent.type(input, '752bd4')
    await userEvent.tab()
    await expect(input).toHaveValue('752BD4')
    await expect(canvas.getByRole('slider')).toBeVisible()
  },
}

/** The alpha slider takes the keyboard: Home drops opacity to zero, which writes the alpha byte. */
export const AdjustsAlpha: Story = {
  render: withValue('#752BD4'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slider = canvas.getByRole('slider')

    slider.focus()
    await userEvent.keyboard('{Home}')
    await expect(canvas.getByRole('textbox', { name: 'Colour' })).toHaveValue('752BD400')
  },
}

/** The swatch opens the picker; moving the area's thumb commits a new colour into the hex field, alpha untouched. */
export const PicksAColour: Story = {
  render: withValue('#752BD480'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Colour' })

    await userEvent.click(canvas.getByRole('button', { name: 'Pick colour' }))
    // The picker portals to document.body and animates in.
    const area = await screen.findByRole('slider', { name: 'Saturation, Brightness' })
    await waitFor(() => expect(area).toBeVisible())

    area.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(input).not.toHaveValue('752BD480')
    await expect((input as HTMLInputElement).value).toMatch(/80$/)
  },
}
