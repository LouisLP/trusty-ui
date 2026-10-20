/**
 * The CodeMirror lifecycle, shared by the two editing surfaces: the compartments, the `EditorView`, the history and default keymap, the equality-guarded setter. What differs between a code field and a prose field is the extensions, and those are all a surface passes in.
 *
 * Why there is no index.ts in this folder: this module statically imports `@codemirror/*`, and a barrel re-exporting it alongside `useEditorHost.ts` would drag CodeMirror into the main bundle through the composable the SFCs import statically. Both files are reached by their own names.
 */

import type { Extension } from '@codemirror/state'
import type { ViewUpdate } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as placeholderExtension } from '@codemirror/view'

export interface EditorHostOptions {
  /** Must already be in the document — CodeMirror measures against it. */
  parent: HTMLElement
  doc: string
  editable: boolean
  placeholder?: string
  /** Forwarded onto the editable element. CodeMirror builds its own DOM, so this is the only route by which `TrustyFormItem`'s `id` and `aria-describedby` reach the textbox. */
  contentAttributes: Record<string, string>
  /** Fired on every document change, never on a bare selection move. */
  onChange: (doc: string) => void
  /** Every update, for surfaces that also track the selection (the toolbar). */
  onUpdate?: (update: ViewUpdate) => void
  /** The surface's own extensions: its theme, its decorations, its keymaps. Installed before the shared history and default keymap, so a surface keymap gets first refusal. */
  extensions: Extension[]
}

export interface EditorHost {
  /** The live view, for surface behaviour that needs to dispatch its own edits. */
  readonly view: EditorView
  getDoc: () => string
  /** No-ops when the text already matches, which is what keeps a v-model from looping. */
  setDoc: (doc: string) => void
  setEditable: (editable: boolean) => void
  setContentAttributes: (attributes: Record<string, string>) => void
  /** Swap one of the surface's own compartments. */
  reconfigure: (compartment: Compartment, extension: Extension) => void
  focus: () => void
  destroy: () => void
}

export function createEditorHost(options: EditorHostOptions): EditorHost {
  const editable = new Compartment()
  const attributes = new Compartment()

  const view = new EditorView({
    parent: options.parent,
    state: EditorState.create({
      doc: options.doc,
      extensions: [
        ...options.extensions,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        editable.of(EditorView.editable.of(options.editable)),
        attributes.of(EditorView.contentAttributes.of(options.contentAttributes)),
        options.placeholder ? placeholderExtension(options.placeholder) : [],
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            options.onChange(update.state.doc.toString())
          }
          options.onUpdate?.(update)
        }),
      ],
    }),
  })

  function reconfigure(compartment: Compartment, extension: Extension) {
    view.dispatch({ effects: compartment.reconfigure(extension) })
  }

  return {
    view,
    getDoc: () => view.state.doc.toString(),
    setDoc(doc) {
      if (doc === view.state.doc.toString()) {
        return
      }
      // Replacing the whole document keeps undo history intact (unlike a fresh state), and the selection is clamped by CodeMirror.
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: doc } })
    },
    setEditable(value) {
      reconfigure(editable, EditorView.editable.of(value))
    },
    setContentAttributes(next) {
      reconfigure(attributes, EditorView.contentAttributes.of(next))
    },
    reconfigure,
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  }
}
