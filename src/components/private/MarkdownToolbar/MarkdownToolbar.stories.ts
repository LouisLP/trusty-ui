import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import MarkdownToolbar from './MarkdownToolbar.vue'

const meta = {
  title: 'Private/MarkdownToolbar',
  component: MarkdownToolbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Private — not exported from \`@louislp/trusty-ui\`.** The formatting bar the markdown
editor wears, catalogued here only so it can be developed and reviewed against
its design. Consumers get it through the editor, never on its own, which is why
it carries a fixed action set instead of an \`items\` prop.

One strip, one tab stop: Tab moves into the bar, left/right arrows move along
every segment across group boundaries, Enter or Space presses one. Four groups,
divided by rules — headings, emphasis (plus the link), blocks, lists. Headings
and lists are mutually exclusive; emphasis and blocks stack.

**It folds as it narrows.** Blocks move into a \`⋯\` menu first, then headings,
then lists; emphasis and the link never fold, because they are what a
formatting bar is for. The menu lists what folded in the bar's own order rather
than in the order it folded, so headings head the menu exactly as they head the
bar. The bar never wraps to a second row — folding is the only way it gets
narrower.

The thresholds are read off the bar's own layout once, on mount
(\`MarkdownToolbar.responsive.ts\`), so the stylesheet stays the authority on how
wide a button is. Hardcoded constants were tried first and drifted from the CSS,
which is exactly how a bar sails past a threshold and grows a second row.

Each action carries a shortcut: a tooltip names it on hover ("Bold (⌘+B)"), the
menu rows draw it with \`TrustyKeyboardBadge\`, and every button announces it
through \`aria-keyshortcuts\`. Either primary
modifier works — ⌘B and Ctrl+B both mean bold — so nothing here sniffs the
platform. Handling the keys is the editor's job, since it owns the text area:
\`markdownShortcutFor(event)\` turns a real keydown back into an action.

The bar holds no formatting state and edits no text. \`active\` says which
formats apply where the caret sits, \`select\` reports which action was pressed —
including a press that turns one off — and \`link\` fires with a URL confirmed in
the popover: one field, no button, Enter to apply and Escape to abandon. What any of it *means* is the editor's.
`,
      },
    },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    linkDisabled: { control: 'boolean' },
    onSelect: { action: 'select' },
    onLink: { action: 'link' },
  },
  args: {
    active: [],
    disabled: false,
    linkDisabled: false,
  },
} satisfies Meta<typeof MarkdownToolbar>

export default meta
type Story = StoryObj<typeof meta>

/** The bar as the design draws it, nothing pressed. */
export const Default: Story = {}

/** Interaction test — the two things that hang off a segment: a tooltip naming the action and its keys, and, on the link, a popover that still opens through the tooltip wrapping its trigger. */
export const HintsAndLinkPanel: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    // Both the tooltip and the popover portal to the body, outside the story root.
    const screen = within(canvasElement.ownerDocument.body)

    await step('a focused segment names itself and its shortcut', async () => {
      canvas.getByRole('button', { name: 'Bold' }).focus()
      // Tooltips scale in, so they are in the DOM before they are visible. Reka also renders a visually-hidden copy for screen readers, so this asks for the drawn one by class rather than by its text.
      const hint = await waitFor(() => {
        const drawn = canvasElement.ownerDocument.querySelector('.trusty-tooltip')
        expect(drawn).toBeVisible()
        return drawn!
      })
      await expect(hint).toHaveTextContent(/^Bold \(.+B\)$/)
    })

    await step('the link opens its panel despite the tooltip around its trigger', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Link' }))
      const field = await screen.findByLabelText('Link URL')
      await waitFor(() => expect(field).toBeVisible())
    })
  },
}

/** `active` shows the formats that apply where the caret sits. */
export const Active: Story = {
  args: { active: ['italic', 'bulleted-list'] },
}

/** Linking needs something to link, so the editor dims it while the selection is empty. */
export const LinkDisabled: Story = {
  args: { linkDisabled: true },
}

export const Disabled: Story = { args: { disabled: true } }

/** Disabled with formats still on. The pressed fill is the colour the icon dims to, so a disabled segment keeps its glyph and carries the pressed state on a border instead. */
export const DisabledWithActiveFormats: Story = {
  args: { disabled: true, active: ['bold', 'heading-2', 'numbered-list'] },
}

/** The bar at four widths, so every collapse level is visible at once — resize the panel to watch one cross them. Each fold moves a whole group into the `⋯` menu; none of them wraps. */
export const Narrow: Story = {
  render: args => ({
    components: { MarkdownToolbar },
    setup: () => ({ args, widths: [360, 320, 260, 190] }),
    template: `
      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        <div v-for="width in widths" :key="width" :style="{ inlineSize: width + 'px' }">
          <p style="margin: 0 0 var(--space-2xs); font-family: var(--font-family-mono); font-size: var(--font-size-xs); color: var(--color-text-muted);">
            {{ width }}px
          </p>
          <MarkdownToolbar v-bind="args" />
        </div>
      </div>
    `,
  }),
}

/** What the bar is for: sitting flush on top of the editing surface, reporting presses that the surface turns into markdown. The mapping below is the editor's job, never the toolbar's. */
export const AboveATextarea: Story = {
  render: args => ({
    components: { MarkdownToolbar },
    setup() {
      const WRAPPERS: Record<string, string> = {
        'bold': '**',
        'italic': '_',
        'strikethrough': '~~',
        'inline-code': '`',
        'underline': '<u>',
      }
      const PREFIXES: Record<string, string> = {
        'heading-1': '# ',
        'heading-2': '## ',
        'heading-3': '### ',
        'bulleted-list': '- ',
        'numbered-list': '1. ',
        'quote': '> ',
        'code-block': '```\n',
      }

      const text = ref('Select some words, then press a button.')
      const editor = ref<HTMLTextAreaElement>()
      const hasSelection = ref(false)

      function trackSelection() {
        const field = editor.value
        hasSelection.value = Boolean(field && field.selectionStart !== field.selectionEnd)
      }

      function apply(action: string) {
        const field = editor.value
        if (!field)
          return
        const { selectionStart: start, selectionEnd: end } = field
        const wrapper = WRAPPERS[action]
        const prefix = PREFIXES[action]

        if (wrapper) {
          const close = wrapper.startsWith('<') ? wrapper.replace('<', '</') : wrapper
          text.value = `${text.value.slice(0, start)}${wrapper}${text.value.slice(start, end)}${close}${text.value.slice(end)}`
        }
        else if (prefix) {
          const lineStart = text.value.lastIndexOf('\n', start - 1) + 1
          text.value = `${text.value.slice(0, lineStart)}${prefix}${text.value.slice(lineStart)}`
        }
        field.focus()
      }

      function insertLink(url: string) {
        const field = editor.value
        if (!field)
          return
        const { selectionStart: start, selectionEnd: end } = field
        const label = text.value.slice(start, end) || url
        text.value = `${text.value.slice(0, start)}[${label}](${url})${text.value.slice(end)}`
        field.focus()
      }

      return { args, text, editor, hasSelection, trackSelection, apply, insertLink }
    },
    template: `
      <div style="display: flex; flex-direction: column; max-inline-size: 480px;">
        <MarkdownToolbar
          v-bind="args"
          :link-disabled="!hasSelection"
          @select="apply"
          @link="insertLink"
        />
        <textarea
          ref="editor"
          v-model="text"
          rows="6"
          aria-label="Markdown source"
          @select="trackSelection"
          @keyup="trackSelection"
          @mouseup="trackSelection"
          style="font-family: var(--font-family-mono); font-size: var(--font-size-sm); color: var(--color-text); background-color: var(--color-secondary-muted); border: var(--border-md) solid var(--color-border); border-block-start: none; border-radius: 0 0 var(--radius-sm) var(--radius-sm); padding: var(--space-sm);"
        ></textarea>
      </div>
    `,
  }),
}
