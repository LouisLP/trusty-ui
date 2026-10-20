import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TrustyMarkdownEditor from './TrustyMarkdownEditor.vue'

const SAMPLE = `# Release notes
The **editor** styles markdown as you type (no preview pane, no second mode). Click into a line to see the markers behind it; leave it and they go away again.
This paragraph has a linebreak before getting into it. So it looks distinct.
> A quote is one band, not one box per line.
> Consecutive lines read as one block.
Use \`inline code\` for a symbol, and a fence for more:
\`\`\`
pnpm add @louislp/trusty-ui
\`\`\`
- Emphasis stacks: **_bold and italic_**
- Headings and lists do not
  - Indent the source to nest an item
- [Links](https://vuejs.org/) show their label, not their target — ⌘-click one to open it
---
That rule above is three dashes.`

const meta = {
  title: 'Form/Controls/TrustyMarkdownEditor',
  component: TrustyMarkdownEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A markdown field: the formatting bar on top of a surface that **styles the
markdown as it is typed**. One value — the markdown source — and no preview
pane. The styling *is* the preview, which is why nothing here renders HTML and
the library ships no markdown renderer: what you store is what the consumer
renders, however it likes.

**The markers are concealed until the caret reaches them.** A heading shows no
\`#\`, \`**bold**\` reads as **bold**, a link shows its label and not its target,
and a fenced block shows neither fence — until the caret lands there, and what it
landed on becomes editable source again.

How much comes back is the width of what the marker describes. A **block**
marker is its line — click anywhere on a heading, a quote or a list item and its
own syntax reveals, however long the line and wherever on it the caret sits. An
**inline** marker is one run inside the line, so only the run you click into
reveals: put the caret in the one bold word of a paragraph and just its \`**\`
come back, while the rest of the line keeps reading as prose. Nested runs come
back together, since \`**_both_**\` is one place. A fenced block reveals as a
whole, its fences being lines of their own.

A field nobody is editing shows no markers at all: revealing follows the caret
only while the field has focus, so a blurred editor never sits there displaying
the line its caret was last left on.

Nothing is ever rewritten to achieve this — the document is exactly what you
typed, and \`v-model\` never fires on a caret move. Only what is *drawn* changes.

Quotes and fenced code are drawn as **bands** — one tinted box around the *whole
run*, its rounding and its outer edges only on the rows that open and close it —
so three quoted lines read as one block instead of three stacked boxes. A quote
carries a single spine down its leading edge; a fenced block sits inside a full
frame, on the one surface in the field darker than the field itself. A block
taller than the field scrolls with the field, which is the only scroller the
surface has: see \`maxRows\`. Headings scale, emphasis stacks (\`**_both_**\` is bold
*and* italic), and code holds no emphasis at all.

**A line break opens a gap; wrapping does not.** Every block edge — a heading
giving way to its paragraph, one paragraph to the next, a paragraph to a quote or
a list — opens a half-gap on each side of itself, so blocks stand off each other
instead of running together. Press Enter and you have started a second paragraph,
and it is spaced off the first. A paragraph that merely *wraps* stays packed
however tall it grows, because it is still one paragraph. Bands and lists are
packed too: their lines are lines of one thing, and a gap between two quoted
lines or two items would say otherwise.

A **band** takes its gap differently, because its tint covers its own padding:
the air that separates it from the block above and below is carried entirely by
those blocks, and what is inside the tint is the band's own breathing room. So a
quote stands off its neighbours by a full gap and still has room around the words
in it.

List markers are the one thing left on screen — concealing them would take the
list's shape with them — and items hang a step to the leading edge of the prose,
so a run of them reads as a list rather than as short paragraphs. A number is already the thing it means and is
left alone; a bulleted item's \`-\`, \`*\` or \`+\` is *drawn* as a **•**, and hands
its own character back when the caret lands on the line. Nesting is the source's
own indentation, which is why only the one marker character is ever swapped. A
thematic break (\`---\`, \`***\` or \`___\`) draws the rule itself, and shows its
dashes again when the caret lands on the line.

**A link opens on ⌘- or Ctrl-click**, or with ⌘/Ctrl+Enter from the caret, in a
new tab — a plain click still has to mean "put the caret here" while the field is
being edited, so it does not open one. In a disabled field there is no caret to
place and a plain click opens. The target is the element's tooltip, so a label
that hides its URL can still be checked before it is followed. Only
\`http\`, \`https\`, \`mailto\` and \`tel\` targets open: the document is user input,
so a \`javascript:\` target is drawn as a link and does nothing.

**The bar reflects the caret.** Move it into a quoted, bolded word and both
segments press; move it out and both release. Linking stays dimmed until
something is selected, because a link needs a label.

**Every action has a shortcut**, and it is the one the bar announces — ⌘B or
Ctrl+B for bold, either modifier, on any platform. Enter continues a list or a
quote and counts a numbered list on; Enter on an empty item ends the list. **Tab
nests a list item** and Shift+Tab lifts it back out — by the width of the item's
own marker, which is the column a child has to reach to be one. Off a list, and
at the outer level of one going backwards, Tab moves focus the way it does in any
other field: a field a keyboard cannot leave is a trap.

The bar is chrome, not part of the field: hover and focus light the **text area**
alone, and clicking the bar does not take focus off the text, so the selection
survives the press. A format toggle is one undo step.

\`rows\` and \`maxRows\` bound the text area in real lines — it grows as it is
typed into, and scrolls once it hits \`maxRows\`. The scroller is CodeMirror's
own, deliberately, and not a \`TrustyScrollArea\`: the editor renders only the
lines in view and measures them against its own element, so a scroll container
outside it would report the wrong viewport and it would draw the wrong lines.

**Use it when**
- a field holds prose the user should be able to format — a description, a
  comment, release notes, a report
- you want markdown *stored*, and the formatting shown while it is written
- the field belongs in a form: wrap it in \`TrustyFormItem\` for its label, hint
  and error, exactly like \`TrustyTextInput\`

**Don't use it for**
- plain unformatted text — use \`TrustyTextInput\`, or \`TrustyEditableText\` for
  edit-in-place
- source code — use \`TrustyCodeBlock\`, which labels the language, highlights it
  with Shiki, and offers a line-number gutter
- rendering markdown that is already written — this component only edits; render
  the stored source in the consuming app
- a full rich-text document with tables, images and embeds — that is a different
  component, and a different editor engine

**Under it:** CodeMirror 6, dynamically imported so it never reaches a bundle
that does not mount the field ([ADR 0001](https://github.com/LouisLP/trusty-ui/blob/main/docs/adr/0001-codemirror-for-code-editing.md)).
No markdown grammar package: the rules are a scanner of pure string functions
(\`TrustyMarkdownEditor.markdown.ts\`), which is also what the bar's pressed state
and the keyboard shortcuts read.

**A contenteditable, not a \`<textarea>\`** — the same consequence
\`TrustyCodeBlock\`'s editor carries: \`required\` is advisory (\`aria-required\`) and
the value does not take part in native form submission. The \`v-model\` is the
value, which is how every Trusty UI form already works.
`,
      },
    },
  },
  argTypes: {
    rows: { control: { type: 'number', min: 2, max: 30 } },
    maxRows: { control: { type: 'number', min: 2, max: 60 } },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    modelValue: SAMPLE,
    placeholder: 'Write something…',
    rows: 6,
    maxRows: 16,
    disabled: false,
    required: false,
    invalid: false,
  },
  render: args => ({
    components: { TrustyMarkdownEditor },
    setup() {
      const text = ref(args.modelValue)
      return { args, text }
    },
    template: `
      <div style="max-inline-size: 640px;">
        <TrustyMarkdownEditor v-bind="args" v-model="text" />
      </div>
    `,
  }),
} satisfies Meta<typeof TrustyMarkdownEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Every construct the bar can produce, styled where it stands. */
export const Default: Story = {}

/** Nothing written yet: the placeholder, and a bar with nothing pressed. */
export const Empty: Story = {
  args: { modelValue: '', rows: 4 },
}

/** A quote and a fenced block are bands across their whole run: the border closes above the first row and below the last, and nowhere between them. */
export const Blocks: Story = {
  args: {
    rows: 10,
    modelValue: `> Three lines, one band.
> The tint and the rule run the width of the field,
> and only the ends of the run are rounded.
\`\`\`
one fenced block
its fences concealed
\`\`\`
Back to a paragraph.`,
  },
}

/** A fenced block longer than the field: one border still closes around the whole run, and the rows between the ends carry no rule of their own. The overflow goes to the field's own scroller (`maxRows`) — CodeMirror gives every line its own element and no way to wrap a run of them, so a block cannot hold a scroller of its own. */
export const LongCodeBlock: Story = {
  args: {
    rows: 8,
    maxRows: 20,
    modelValue: `Before the block.
\`\`\`
{
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
}
\`\`\`
After the block.`,
  },
}

/** Headings scale and emphasis stacks — click a line to see what is behind it. */
export const Emphasis: Story = {
  args: {
    rows: 8,
    modelValue: `# Heading 1
    **bold**, _italic_, **_both_**, ~~struck~~, <u>underlined</u>, \`code\`.
## Heading 2
**bold**, _italic_, **_both_**, ~~struck~~, <u>underlined</u>, \`code\`.
### Heading 3
**bold**, _italic_, **_both_**, ~~struck~~, <u>underlined</u>, \`code\`.`,
  },
}

/** Lists renumber as they are written, and Enter carries the marker on. */
export const Lists: Story = {
  args: {
    rows: 8,
    modelValue: `## Ordered Lists
1. First
2. Second
3. Third
## Unordered Lists
- Press Enter at the end of an item for the next one
- Press it on an empty item to leave the list
`,
  },
}

/** A thematic break is drawn, not spelled: \`---\` becomes the rule, and the dashes come back when the caret lands on the line. Three dashes, three asterisks and three underscores all mean the same rule. */
export const Rules: Story = {
  args: {
    rows: 8,
    modelValue: `Above the rule.
---
Between two rules.
***
Below them both. These are all single linebreaks between each block btw.`,
  },
}

/** A link shows its label; the target is its tooltip, and ⌘- or Ctrl-click — or ⌘/Ctrl+Enter from the caret — opens it in a new tab. A plain click still puts the caret in the text. */
export const Links: Story = {
  args: {
    rows: 6,
    modelValue: `[Vue](https://vuejs.org/): ⌘-click or Ctrl-click to open.

Write to [someone](mailto:someone@example.com), or leave a bare
https://vuejs.org/ (which is text and not a link).`,
  },
}

/** Read-only: the surface stops accepting edits and every segment dims with it. */
export const Disabled: Story = {
  args: { disabled: true, rows: 4, modelValue: '# Locked\nNothing in here can be edited.' },
}

/** The error state a field paints when `TrustyFormItem` reports one. */
export const Invalid: Story = {
  args: { invalid: true, rows: 4, modelValue: 'Too short.' },
}

/** `rows` is where the text area starts, `maxRows` where it stops growing and starts scrolling — both in real lines, so a heading's larger line box counts for what it is. */
export const Capped: Story = {
  args: { rows: 3, maxRows: 6 },
}

/** Click around to bring markers back. A block's syntax reveals from anywhere on its line; an inline run's reveals only when the caret is in that run, so the words either side keep reading as prose. */
export const ClickIntoALine: Story = {
  args: {
    rows: 9,
    modelValue: `## Click me
Then click into **this**, or [this link](https://vuejs.org/), and see that the words around them stay as they are.
> Or this quote — the whole band reveals as one.
\`\`\`
and this block, fences included
\`\`\``,
  },
}

/** What the field is really for: the source is the value, so the consumer can store it, diff it, or render it — none of which is this component's job. */
export const TheValueIsMarkdown: Story = {
  render: args => ({
    components: { TrustyMarkdownEditor },
    setup() {
      const text = ref('Write **markdown**, and read it back below.')
      return { args, text }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--space-md); max-inline-size: 640px;">
        <TrustyMarkdownEditor v-bind="args" v-model="text" :rows="4" />
        <pre style="margin: 0; padding: var(--space-sm); font-family: var(--font-family-mono); font-size: var(--font-size-xs); color: var(--color-text-muted); background-color: var(--color-bg-accented); border-radius: var(--radius-xs); white-space: pre-wrap;">{{ text }}</pre>
      </div>
    `,
  }),
}
