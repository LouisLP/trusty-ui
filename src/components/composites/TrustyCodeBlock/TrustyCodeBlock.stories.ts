import type { Decorator, Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyCodeBlock from './TrustyCodeBlock.vue'

const SAMPLE_JSON = `{
   "description": "test",
   "type": "variable",
   "class": "button",
   "velocity": 25,
}
{
   "description": "test",
   "type": "variable",
   "class": "button",
   "velocity": 25,
}`

/** Every story is width-constrained, because that is how a consumer uses this: the block fills its parent. A story widens the wrapper with `parameters: { containerWidth }` rather than styling the component itself. */
const withContainerWidth: Decorator = (_story, context) => ({
  setup: () => ({
    maxInlineSize: (context.parameters.containerWidth as string | undefined) ?? '320px',
  }),
  template: '<div :style="{ maxInlineSize }"><story /></div>',
})

const meta = {
  title: 'Data Display/TrustyCodeBlock',
  component: TrustyCodeBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A multi-line code surface: a header with the language label and a copy-to-clipboard
button, above the code with a line-number gutter in a two-axis scroll area.
Setting \`language\` also syntax-highlights the code via Shiki (Tokyo Night theme,
loaded lazily); omit it for plain preformatted text.

Read-only by default. Set \`editable\` and the header gains an **Edit** button:
pressing it swaps the code for a CodeMirror editor — same grammars and theme, so
the colours don't shift — and replaces Edit with **Save**. The language label
becomes a ghost select, collapsed until clicked, so the user can switch the
grammar while editing. It opens on the \`language\` prop, falling back to JSON
when that is omitted. Save commits the draft, returns to the read view, and fires
\`submit\` with the new code and language. Bind \`v-model:code\` (and
\`v-model:language\`) to have the edit written back to your own state as well; a
plain \`:code\` / \`:language\` binding still updates what's displayed. The draft — code and
language alike — is local until Save, so an abandoned edit emits nothing.

While editing, **Tab** indents by two spaces and **Shift+Tab** outdents; **Esc then
Tab** leaves the editor, since Tab no longer moves focus. CodeMirror loads on
first edit from its own chunk, so a consumer who never sets \`editable\` never
ships it.

Constrain the height from outside (\`max-block-size\` on the component) to make
long code scroll; unconstrained, the block grows with its content.

**Use it when**
- showing a multi-line snippet the user may want to read or copy: payloads, configs, logs.
- letting the user correct that snippet in place — set \`editable\`.

**Don't use it for**
- a short inline reference (a file name, a property) inside running text: use a plain
  \`<code>\` element — the base stylesheet styles it on the design system.
- a single line of free text or an identifier in a form: use \`TrustyTextInput\`.
- prose in a form: use \`TrustyTextInput\` — the mono font and gutter are wrong for sentences.
`,
      },
    },
  },
  argTypes: {
    code: { control: 'text', description: 'The code to display, verbatim.' },
    language: {
      control: 'select',
      options: [undefined, 'json', 'python', 'javascript', 'typescript'],
      description: 'Header label + syntax highlighting; a picker while editing (JSON when unset), committed on Save (`v-model:language`). Omit for plain text.',
    },
    lineNumbers: { control: 'boolean' },
    copyable: { control: 'boolean' },
    editable: { control: 'boolean', description: 'Offer an Edit button in the header.' },
    placeholder: { control: 'text', description: 'Shown while the editor is empty (edit mode only).' },
  },
  args: {
    code: SAMPLE_JSON,
    language: 'json',
    lineNumbers: true,
    copyable: true,
    editable: false,
  },
  decorators: [withContainerWidth],
} satisfies Meta<typeof TrustyCodeBlock>

export default meta
type Story = StoryObj<typeof meta>

/** Default — header with language + copy button, line numbers on. */
export const Default: Story = {}

/** Height constrained from outside: the content scrolls vertically. */
export const ConstrainedHeight: Story = {
  render: args => ({
    components: { TrustyCodeBlock },
    setup: () => ({ args }),
    template: '<TrustyCodeBlock v-bind="args" style="max-block-size: 200px;" />',
  }),
}

/** Long lines scroll horizontally; the gutter stays pinned. */
export const HorizontalScroll: Story = {
  args: {
    code: `{\n   "description": "a rather long value that will certainly not fit the container width",\n   "velocity": 25,\n}`,
  },
}

/** Other supported languages. */
export const Python: Story = {
  args: {
    language: 'python',
    code: `def ease_out(t: float) -> float:\n    """Cubic ease-out between two keyframes."""\n    if not 0 <= t <= 1:\n        raise ValueError("t must be between 0 and 1")\n    return 1 - (1 - t) ** 3`,
  },
}

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    code: `export function easeOut(t: number): number {\n  if (t < 0 || t > 1) {\n    throw new Error('t must be between 0 and 1')\n  }\n  return 1 - (1 - t) ** 3\n}`,
  },
}

/** No language: plain preformatted text, no highlighting. */
export const PlainText: Story = { args: { language: undefined } }

export const NoLineNumbers: Story = { args: { lineNumbers: false } }
export const NotCopyable: Story = { args: { copyable: false } }

/** `editable`: the header offers Edit, which swaps the code for the editor. */
export const Editable: Story = { args: { editable: true } }

/** Edit mode, opened by the play function: the language label is now a ghost select, collapsed until the user opens it. Picking a language re-highlights the editor at once; Save commits it. */
export const Editing: Story = {
  args: { editable: true, onSubmit: fn() },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    // The select's list portals to the body, outside the story root.
    const screen = within(canvasElement.ownerDocument.body)

    await step('Edit turns the language label into a collapsed select', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
      const picker = await canvas.findByRole('combobox', { name: 'Code language' })
      await expect(picker).toHaveTextContent('JSON')
      await expect(picker).toHaveAttribute('aria-expanded', 'false')
    })

    await step('picking a language and saving commits both', async () => {
      await userEvent.click(canvas.getByRole('combobox', { name: 'Code language' }))
      const python = await screen.findByRole('option', { name: 'Python' })
      // The list fades in, so it is in the DOM at opacity 0 for a frame or two; waitFor rides out the animation.
      await waitFor(() => expect(python).toBeVisible())
      await userEvent.click(python)
      await userEvent.click(canvas.getByRole('button', { name: 'Save' }))

      await expect(args.onSubmit).toHaveBeenCalledOnce()
      await expect(canvas.getByText('Python')).toBeInTheDocument()
    })
  },
}

/** `v-model:code` writes the saved edit back into the consumer's own state. */
export const EditableWithBinding: Story = {
  args: { editable: true },
  render: args => ({
    components: { TrustyCodeBlock },
    setup() {
      const code = ref(args.code)
      const saves = ref(0)
      return { args, code, saves }
    },
    template: `
      <TrustyCodeBlock v-bind="args" v-model:code="code" @submit="saves++" />
      <p style="margin-block-start: var(--space-sm); font-size: var(--font-size-xs); color: var(--color-text-muted);">
        saved {{ saves }}\u00D7 — {{ code.split('\\n').length }} lines
      </p>
    `,
  }),
}

/** The parent owns the width. The same code that scrolls horizontally in the 320px stories above fits without scrolling here — the component fills what it's given and never sets a width of its own, in either mode. */
export const WideContainer: Story = {
  args: {
    editable: true,
    code: `{\n   "description": "a rather long value that will certainly not fit a narrow container",\n   "type": "variable",\n   "velocity": 25,\n}`,
  },
  parameters: { containerWidth: '760px' },
}
