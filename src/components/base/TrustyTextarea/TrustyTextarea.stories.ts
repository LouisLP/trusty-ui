import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustyTextarea from './TrustyTextarea.vue'

const SAMPLE = 'Export stalled at 62% while rendering the colour-graded timeline. Proxy media regenerated'

const meta = {
  title: 'Form/Controls/TrustyTextarea',
  component: TrustyTextarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The multi-line text field — a native 'textarea' and nothing more. As a layer-1 control it owns just the widget: no label, hint, or error text of its own, and 'invalid'/'required' usually arrive through TrustyFormItem's field slot.

'rows' is the height (3 by default), and everything native falls straight through: 'maxlength', 'name', 'readonly', 'spellcheck', 'autocomplete'. Set 'autoGrow' and the field tracks its own content instead of scrolling — 'rows' becomes the floor. It leans on CSS 'field-sizing', so a browser without it keeps the fixed height and scrolls; nothing is ever clipped.

The field can be dragged taller but never wider, so it cannot escape the form column it sits in, and the drag stops at the height of a single-line control — it cannot be collapsed to a slot that hides its own value.

**Use it when**
- a form needs more than one line of plain text: a note, a comment, a description, a pasted log.

**Don't use it for**
- one line of text: use TrustyTextInput
- prose the user formats — headings, lists, links: use TrustyMarkdownEditor
- source code: use TrustyCodeBlock's edit mode
- editing a value in place, without a form around it: use TrustyEditableText
`,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    rows: { control: { type: 'number', min: 1, max: 20 } },
    autoGrow: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    placeholder: 'Placeholder',
    rows: 3,
    autoGrow: false,
    disabled: false,
    required: false,
    invalid: false,
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 20rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyTextarea>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>, initial = '') {
  return {
    components: { TrustyTextarea },
    setup() {
      const model = ref(initial)
      return { args, model }
    },
    template: '<TrustyTextarea v-bind="args" v-model="model" aria-label="Demo textarea" />',
  }
}

export const Default: Story = { render: args => render(args) }

/** A value long enough to scroll — the slim scrollbar appears inside the frame. */
export const Filled: Story = { render: args => render(args, SAMPLE) }

export const Invalid: Story = { render: args => render(args, SAMPLE), args: { invalid: true } }
export const Disabled: Story = { render: args => render(args, SAMPLE), args: { disabled: true } }

/** `autoGrow` trades the scrollbar for height: the field is `rows` tall when empty and follows the value from there. */
export const AutoGrow: Story = { render: args => render(args, SAMPLE), args: { autoGrow: true, rows: 2 } }

/** Layer 2 supplies the label, the required marker, the error text, and the ARIA linking them to the control. */
export const InAFormItem: Story = {
  render: args => ({
    components: { TrustyFormItem, TrustyTextarea },
    setup() {
      const model = ref('')
      return { args, model }
    },
    template: `
      <TrustyFormItem label="Label" error="Error message" required>
        <template #default="{ field }">
          <TrustyTextarea v-bind="{ ...args, ...field }" v-model="model" />
        </template>
      </TrustyFormItem>
    `,
  }),
}

/** Interaction test — typing keeps the newline, and the field stays on the keyboard's own terms: Tab moves focus out rather than indenting. */
export const TypesMultipleLines: Story = {
  render: args => render(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByRole('textbox')

    await userEvent.click(textarea)
    await userEvent.keyboard('first{Enter}second')
    await expect(textarea).toHaveValue('first\nsecond')

    // A textarea is not a code editor: Tab leaves the field instead of inserting one.
    await userEvent.tab()
    await expect(textarea).not.toHaveFocus()
    await expect(textarea).toHaveValue('first\nsecond')
  },
}
