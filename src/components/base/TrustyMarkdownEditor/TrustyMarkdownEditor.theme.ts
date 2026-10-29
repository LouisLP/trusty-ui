/**
 * The editor's own stylesheet, through CodeMirror's theme facet rather than scoped CSS: the editor's DOM is created by CodeMirror, so it never carries Vue's scope attribute.
 *
 * The surface is prose, not code — sans-serif and wrapping — and only the two code roles switch to mono.
 *
 * **This file and the decorations are a mirror pair.** `TrustyMarkdownEditor.editor.ts` builds the `cm-md-*` class names from the scanner's roles, and a role added there with no rule here is silently drawn as plain text. Any class the two halves agree on by name is exported from here.
 */

import { EditorView } from '@codemirror/view'

/** On the editor while a modifier is held. CSS cannot see a held modifier, so this class is what turns the cursor over a link into a pointer. */
export const MODIFIER_HELD_CLASS = 'cm-md-modifier-held'

/** #3f75df at 40%, spelled out because there is no semantic token for a selection tint. */
const SELECTION_TINT = 'color-mix(in srgb, #3f75df 40%, transparent)'

export const markdownEditorTheme = EditorView.theme({
  '&': {
    color: 'var(--color-text-toned)',
    backgroundColor: 'transparent',
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-sm)',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  // The editor's own scroller, not a TrustyScrollArea: CodeMirror renders only the lines in view and measures them against this element, so a container outside it would report the wrong viewport. The one scrollable surface in the library that has to stay native.
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: 'var(--line-height-normal)',
    // The editor is a flex column and the scroller its only child, so this makes the scroller fill the field rather than stop under the first line. It also puts the editable element under every click in an empty field.
    flexGrow: 1,
    overflow: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--color-border) transparent',
  },
  '.cm-content': {
    padding: 'var(--space-xs) var(--space-sm)',
  },
  '.cm-line': {
    padding: '0',
  },

  // The gap between one block and the next: half below the block that ends, half above the one that begins, so the two sit `--space-sm` apart. On a run's outer rows only, and what counts as a run is the editor's PACKED_BLOCKS.
  //
  // Padding rather than a margin, because CodeMirror measures lines with `getBoundingClientRect()` and a margin would leave its height map short at every block edge. Split across the two rows because a band paints its tint over its own half, so half from each neighbour is what gives every band untinted air.
  '.cm-md-run-start': {
    paddingBlockStart: 'var(--space-xs)',
  },
  '.cm-md-run-end': {
    paddingBlockEnd: 'var(--space-xs)',
  },

  // A band is the exception (see BAND_BLOCKS in the decorations). A band's tint covers its own padding, so the half-gap it carries reads as inner padding rather than as air; the row facing the band takes the whole gap instead.
  //
  // Later than the rules above and at the same specificity, so these win on a row that is both a run edge and a band's neighbour.
  '.cm-md-under-band': {
    paddingBlockStart: 'var(--space-sm)',
  },
  '.cm-md-over-band': {
    paddingBlockEnd: 'var(--space-sm)',
  },
  // CodeMirror's own caret, not the browser's.
  '.cm-cursor, .cm-dropCursor': {
    borderInlineStartColor: 'var(--color-text)',
  },
  '.cm-placeholder': {
    color: 'var(--color-text-muted)',
  },
  '.cm-selectionBackground': {
    background: SELECTION_TINT,
  },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
    background: SELECTION_TINT,
  },

  // Only reached where the selection has revealed a marker; everywhere else the markers are concealed outright (see decorationsFor).
  '.cm-md-syntax': {
    color: 'var(--color-text-muted)',
  },

  // Content, not syntax, so it keeps the text colour whether or not the line is revealed. The bullet widget sits inside this mark and needs no colour of its own.
  '.cm-md-list-marker': {
    color: 'var(--color-text-toned)',
  },

  // An item hangs to the inline-start of the prose around it, which is what makes a run of them read as a list. Padding, not a margin, for the height-map reason above.
  //
  // A wrapped item continues under its own marker rather than under its text: a true hanging indent would have to know the marker's width, and `1.` and `10.` are not the same width. Deeper nesting is the source's own leading spaces, on top of this.
  '.cm-md-bulleted-list, .cm-md-numbered-list': {
    paddingInlineStart: 'var(--space-sm)',
  },

  // The third heading is body size, so weight alone separates it from a paragraph.
  '.cm-md-heading-1': {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 'var(--line-height-normal)',
  },
  '.cm-md-heading-2': {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 'var(--line-height-normal)',
  },
  '.cm-md-heading-3': {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 'var(--line-height-normal)',
  },

  // Quote and fenced code are bands: one box around the whole run, not one per line. CodeMirror offers no way to wrap a run of lines in a parent, so the box is drawn as rows that each carry a slice of it — tint and inline edges on every row, block edges and rounding only on the rows that start and end the run.
  //
  // A band's block inset is the half-gap its outer rows already carry, so only the inline inset is set here; each band's own fill and edges are below.
  '.cm-md-quote, .cm-md-code-block': {
    position: 'relative',
    paddingInlineStart: 'var(--space-sm)',
    paddingInlineEnd: 'var(--space-xs)',
  },

  // A band's fill is painted by a pseudo-element under the row, not by the row.
  '.cm-md-quote::before, .cm-md-code-block::before': {
    content: '""',
    position: 'absolute',
    inset: '0',
    zIndex: '-2',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
  // The band's own air, inside the tint: 12px above the first line and below the last, which is the half-gap the row already carries plus a `--space-sm`. There is no 12px step in the scale, so it is spelled as the two that make it.
  '.cm-md-quote.cm-md-run-start, .cm-md-code-block.cm-md-run-start': {
    paddingBlockStart: 'calc(var(--space-xs) + var(--space-sm))',
    borderStartStartRadius: 'var(--radius-xs)',
    borderStartEndRadius: 'var(--radius-xs)',
  },
  '.cm-md-quote.cm-md-run-end, .cm-md-code-block.cm-md-run-end': {
    paddingBlockEnd: 'calc(var(--space-xs) + var(--space-sm))',
    borderEndStartRadius: 'var(--radius-xs)',
    borderEndEndRadius: 'var(--radius-xs)',
  },

  // A quote is a tinted panel with one spine down its inline-start edge and no other edge, so every row carries the spine and no row rules across the band. Its text is not dimmed and not italic: dimming a quote in an editable field makes it look disabled.
  '.cm-md-quote': {
    borderInlineStart: 'var(--border-md) solid var(--color-border)',
  },
  '.cm-md-quote::before': {
    backgroundColor: 'var(--color-bg-inset-muted)',
  },

  // A fenced block is a full frame on the sunken surface, the one background darker than the field itself, which is what makes it read as inset.
  '.cm-md-code-block': {
    borderInline: 'var(--border-sm) solid var(--color-border)',
    fontFamily: 'var(--font-family-mono)',
  },
  '.cm-md-code-block.cm-md-run-start': {
    borderBlockStart: 'var(--border-sm) solid var(--color-border)',
  },
  '.cm-md-code-block.cm-md-run-end': {
    borderBlockEnd: 'var(--border-sm) solid var(--color-border)',
  },
  '.cm-md-code-block::before': {
    backgroundColor: 'var(--color-bg-sunken)',
  },

  '.cm-md-bold': {
    fontWeight: 'var(--font-weight-bold)',
  },
  '.cm-md-italic': {
    fontStyle: 'italic',
  },
  '.cm-md-underline': {
    textDecoration: 'underline',
  },
  '.cm-md-strikethrough': {
    textDecoration: 'line-through',
  },
  '.cm-md-inline-code': {
    paddingBlock: 'var(--space-2xs)',
    paddingInline: 'var(--space-xs)',
    fontFamily: 'var(--font-family-mono)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-toned)',
    overflowWrap: 'break-word',
    backgroundColor: 'var(--color-bg-sunken)',
    border: 'var(--border-sm) solid var(--color-border)',
    borderRadius: 'var(--radius-xs)',
  },
  // Colour alone at rest, with the underline held back for hover, the way an unclassed anchor behaves in base.css.
  '.cm-md-link': {
    color: 'var(--color-primary-highlight)',
    textDecoration: 'none',
  },
  '.cm-md-link:hover': {
    textDecoration: 'underline',
    textDecorationThickness: 'from-font',
    textUnderlinePosition: 'from-font',
  },
  // Only honest where a plain click cannot mean "put the caret here".
  '.cm-content[contenteditable=false] .cm-md-link': {
    cursor: 'pointer',
  },
  // And in an editable field for as long as the modifier that opens is held.
  [`&.${MODIFIER_HELD_CLASS} .cm-md-link`]: {
    cursor: 'pointer',
  },

  // A rule is the line: its own text is concealed like any other marker, so off the caret's line an empty line carries the rule.
  //
  // Painted through the middle of that line rather than along its bottom edge, because a border sits where the line box ends and would leave a whole line of text above the rule and only a half-gap below it.
  '.cm-md-horizontal-rule': {
    backgroundImage: 'linear-gradient(var(--color-border), var(--color-border))',
    backgroundSize: '100% var(--border-sm)',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: 'var(--color-text-muted)',
  },
  // Except while the dashes are back: a rule through the middle of the line would strike through the text the caret is in.
  '.cm-md-horizontal-rule:has(.cm-md-syntax)': {
    backgroundImage: 'none',
  },
})
