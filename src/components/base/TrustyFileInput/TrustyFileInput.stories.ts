import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyFileInput from './TrustyFileInput.vue'

/** A `File` with a believable size, so the rows read like the design's "547KB". */
function sample(name: string, size: number) {
  const made = new File(['x'], name)
  Object.defineProperty(made, 'size', { value: size })
  return made
}

const meta = {
  title: 'Form/Controls/TrustyFileInput',
  component: TrustyFileInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A form control whose value is a list of \`File\` objects. A dashed dropzone takes files by drag-and-drop or through the native picker, and every held file gets a row underneath with its name, its size and a \`×\`.

The control is a visually hidden \`<input type="file">\` — that is what takes the field's \`id\`, what \`required\` lands on, and what Tab reaches; the dropzone paints its focus ring, and Enter or Space opens the picker. The "Browse files" button and the dropzone's own click are pointer-only duplicates of that path.

No visible label is rendered, so the input names itself "Files" when nothing else names it. Wrapping it in \`TrustyFormItem\` (or passing your own \`aria-label\`) replaces that fallback.

**Validation is the consumer's.** \`accept\` filters the picker exactly as the platform does, and nothing else is checked: a dropped file that violates \`accept\`, exceeds a size ceiling, or pushes past a count still arrives in the model, and the app decides what that means. Wrap the control in \`TrustyFormItem\` and feed the verdict back as \`error\`.

**Use it when**
- the user hands the app one or more files: an upload field, an import step, an attachment picker.

**Don't use it for**
- a plain text value, a number, or a list of strings: use TrustyTextInput, TrustyNumberField or TrustyTagInput
- showing files the app already holds, with no way to add one: render TrustyCard or TrustyTable rows instead
- the label, hint and error text around this field: wrap it in TrustyFormItem
`,
      },
    },
  },
  argTypes: {
    accept: { control: 'text', description: 'Picker filter, e.g. `image/*,.pdf`. Not enforced on drop.' },
    description: { control: 'text' },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    description: 'SVG, PNG, JPG or GIF (max. 2MB)',
    multiple: false,
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 24rem"><story /></div>' })],
} satisfies Meta<typeof TrustyFileInput>

export default meta
type Story = StoryObj<typeof meta>

/** Default — empty, so only the dropzone shows. */
export const Default: Story = {}

/** Three held files, each row showing its name and formatted size. */
export const Filled: Story = {
  args: {
    multiple: true,
    modelValue: [
      sample('FileUpload.vue', 560128),
      sample('TrustyFileInput.spec.ts', 12873),
      sample('dropzone-mock.png', 2306867),
    ],
  },
}

/** Without `description` the dropzone is just the heading and the button. */
export const NoDescription: Story = {
  args: { description: '' },
}

/** The error state. `TrustyFormItem` normally sets this from its own slot props. */
export const Invalid: Story = {
  args: { invalid: true, modelValue: [sample('too-big.zip', 48234496)] },
}

/** Disabled mutes the surface and the text, and takes every button with it. */
export const Disabled: Story = {
  args: { disabled: true, modelValue: [sample('FileUpload.vue', 560128)] },
}

/** Picking through the native input commits the file and adds its row. */
export const PicksFiles: Story = {
  args: { multiple: true },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!

    await userEvent.upload(input, sample('FileUpload.vue', 560128))
    await expect(within(canvasElement).getByText('FileUpload.vue')).toBeVisible()
    await expect(within(canvasElement).getByText('547KB')).toBeVisible()
  },
}

/** A row's `×` drops that file and leaves the rest. The story holds its own model so the removal sticks. */
export const RemovesAFile: Story = {
  render: args => ({
    components: { TrustyFileInput },
    setup() {
      const files = ref([sample('FileUpload.vue', 560128), sample('dropzone-mock.png', 2306867)])
      return { args, files }
    },
    template: '<TrustyFileInput v-bind="args" v-model="files" />',
  }),
  args: { multiple: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Remove FileUpload.vue' }))
    await expect(canvas.queryByText('FileUpload.vue')).not.toBeInTheDocument()
    await expect(canvas.getByText('dropzone-mock.png')).toBeVisible()
  },
}
