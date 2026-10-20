/**
 * The CODE surface: what makes this editor a code editor, and nothing else.
 *
 * The CodeMirror lifecycle lives in `src/internal/codemirror/editor-host.ts`, shared with `TrustyMarkdownEditor.editor.ts`. What is left here is specific to code: the Shiki-fed highlighting, the line-number gutter, the theme, and this surface's Tab policy.
 *
 * CodeEditorBase.vue imports this module dynamically, so CodeMirror lands in its own chunk and never reaches a bundle that opens no editor. The handle is the seam: the SFC owns props, v-model and chrome, this module owns the EditorView.
 */

import type { Extension } from '@codemirror/state'
import type { TrustyCodeLanguage } from '../../../internal/code-highlight'
import type { EditorSurfaceConfig } from '../../../internal/codemirror/useEditorHost'
import { indentLess, indentMore } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { Compartment, Prec } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { createEditorHost } from '../../../internal/codemirror/editor-host'
import { shikiHighlighting } from './CodeEditorBase.shiki'

/** Two spaces, matching the indentation Tab inserts. */
const INDENT = '  '

export interface CodeEditorOptions extends EditorSurfaceConfig {
  language?: TrustyCodeLanguage
  lineNumbers: boolean
  placeholder?: string
}

export interface CodeEditorHandle {
  setDoc: (code: string) => void
  getDoc: () => string
  setLanguage: (language?: TrustyCodeLanguage) => void
  setLineNumbers: (enabled: boolean) => void
  setEditable: (editable: boolean) => void
  setContentAttributes: (attributes: Record<string, string>) => void
  focus: () => void
  destroy: () => void
}

/* Styling goes through CodeMirror's theme facet rather than scoped CSS: the editor's DOM is created by CodeMirror, so it never carries Vue's scope attribute. The values are still semantic tokens. */
const theme = EditorView.theme({
  '&': {
    color: 'var(--color-text)',
    backgroundColor: 'transparent',
    fontFamily: 'var(--font-family-mono)',
    fontSize: 'var(--font-size-sm)',
    // JetBrains Mono would otherwise draw `=>` and `!==` as single glyphs.
    fontVariantLigatures: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    // Same whole-pixel rhythm the read view uses (see TrustyCodeBlock's --code-line-height), so crossing modes never reflows the code.
    lineHeight: 'var(--code-line-height, var(--line-height-normal))',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--color-border) transparent',
  },

  '.cm-content': {
    padding: 'var(--space-xs) var(--space-sm)',
    caretColor: 'var(--color-text)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderInlineStartColor: 'var(--color-text)',
  },
  '.cm-placeholder': {
    color: 'var(--color-text-muted)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--color-primary-muted)',
  },
  '.cm-gutters': {
    color: 'var(--color-text-muted)',

    backgroundColor: 'var(--color-secondary)',
    borderInlineEnd: 'var(--border-sm) solid var(--color-border)',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 var(--space-xs)',
    minWidth: '0',
    userSelect: 'none',
  },
})

export function createCodeEditor(options: CodeEditorOptions): CodeEditorHandle {
  const highlighting = new Compartment()
  const gutter = new Compartment()

  /* Tab indents rather than moving focus, which would otherwise be the one keyboard trap in the component — so Esc arms an escape hatch: the next Tab moves focus normally. Both handlers return false when armed (and for Esc itself), leaving the event unhandled so it still reaches an enclosing dialog. Highest precedence, to win over the default keymap's Tab.

     This is one of the two Tab policies in the library, and the difference is deliberate: code is indented, so Tab must be claimable everywhere and needs an escape hatch. Prose is not, so TrustyMarkdownEditor claims Tab only inside a list and lets it move focus everywhere else — no hatch needed. */
  let tabEscapeArmed = false

  const indentKeymap = Prec.highest(keymap.of([
    {
      key: 'Escape',
      run: () => {
        tabEscapeArmed = true
        return false
      },
    },
    {
      key: 'Tab',
      run: (view) => {
        if (tabEscapeArmed) {
          tabEscapeArmed = false
          return false
        }
        return indentMore(view)
      },
    },
    {
      key: 'Shift-Tab',
      run: (view) => {
        if (tabEscapeArmed) {
          tabEscapeArmed = false
          return false
        }
        return indentLess(view)
      },
    },
  ]))

  // Any other key means the user kept typing, so the hatch closes again.
  const disarmOnTyping = EditorView.domEventHandlers({
    keydown: (event) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') {
        tabEscapeArmed = false
      }
      return false
    },
  })

  const extensions: Extension[] = [
    theme,
    indentUnit.of(INDENT),
    indentKeymap,
    disarmOnTyping,
    gutter.of(options.lineNumbers ? lineNumbers() : []),
    highlighting.of(shikiHighlighting(options.language)),
  ]

  const host = createEditorHost({ ...options, extensions })

  return {
    getDoc: host.getDoc,
    setDoc: host.setDoc,
    setLanguage(language) {
      host.reconfigure(highlighting, shikiHighlighting(language))
    },
    setLineNumbers(enabled) {
      host.reconfigure(gutter, enabled ? lineNumbers() : [])
    },
    setEditable: host.setEditable,
    setContentAttributes: host.setContentAttributes,
    focus: host.focus,
    destroy: host.destroy,
  }
}
