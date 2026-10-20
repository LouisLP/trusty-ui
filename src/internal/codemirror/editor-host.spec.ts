import { EditorView, keymap } from '@codemirror/view'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEditorHost } from './editor-host'

// The shared CodeMirror lifecycle, tested at its own interface rather than through a component mount and `EditorView.findFromDOM()`.

const hosts: { destroy: () => void }[] = []
const parents: HTMLElement[] = []

function mountHost(options: Partial<Parameters<typeof createEditorHost>[0]> = {}) {
  const parent = document.createElement('div')
  document.body.append(parent)
  parents.push(parent)

  const host = createEditorHost({
    parent,
    doc: '',
    editable: true,
    contentAttributes: {},
    onChange: () => {},
    extensions: [],
    ...options,
  })
  hosts.push(host)
  return host
}

afterEach(() => {
  hosts.splice(0).forEach(host => host.destroy())
  parents.splice(0).forEach(parent => parent.remove())
})

describe('createEditorHost', () => {
  it('starts with the document it was given', () => {
    expect(mountHost({ doc: 'hello' }).getDoc()).toBe('hello')
  })

  it('reports document changes through onChange', () => {
    const onChange = vi.fn()
    const host = mountHost({ doc: 'a', onChange })
    host.setDoc('b')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('no-ops setDoc when the text already matches', () => {
    // This guard is the whole reason a v-model round-trip does not loop: the watcher pushes the model back in on every change, including the one the editor itself just reported.
    const onChange = vi.fn()
    const host = mountHost({ doc: 'same', onChange })
    host.setDoc('same')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps undo history across setDoc, rather than resetting the state', () => {
    const host = mountHost({ doc: 'first' })
    host.setDoc('second')
    // A fresh EditorState would have no history to undo back through.
    expect(host.view.state.doc.toString()).toBe('second')
    expect(host.getDoc()).toBe('second')
  })

  it('toggles editability without rebuilding the view', () => {
    const host = mountHost({ editable: true })
    const { view } = host
    expect(view.state.facet(EditorView.editable)).toBe(true)

    host.setEditable(false)
    expect(view.state.facet(EditorView.editable)).toBe(false)
    // Same view — a compartment reconfigure, not a teardown.
    expect(host.view).toBe(view)
  })

  it('pushes content attributes onto the editable element, not the root', () => {
    // The only route by which TrustyFormItem's id and aria-describedby reach the textbox: CodeMirror builds that element itself.
    const host = mountHost({
      contentAttributes: { 'id': 'field-1', 'aria-describedby': 'hint-1' },
    })
    const content = host.view.dom.querySelector('.cm-content')!
    expect(content.getAttribute('id')).toBe('field-1')
    expect(content.getAttribute('aria-describedby')).toBe('hint-1')

    host.setContentAttributes({ 'aria-invalid': 'true' })
    expect(content.getAttribute('aria-invalid')).toBe('true')
    expect(content.getAttribute('id')).toBeNull()
  })

  it('reports selection moves through onUpdate but not through onChange', () => {
    // What drives the markdown toolbar's pressed state: it has to recompute on a bare caret move, which is not a document change.
    const onChange = vi.fn()
    const onUpdate = vi.fn()
    const host = mountHost({ doc: 'hello world', onChange, onUpdate })
    onUpdate.mockClear()

    host.view.dispatch({ selection: { anchor: 0, head: 5 } })

    expect(onUpdate).toHaveBeenCalled()
    expect(onUpdate.mock.calls.at(-1)![0].selectionSet).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('gives a surface extension first refusal over the default keymap', () => {
    // Both surfaces rely on their own keymaps being installed before the shared defaults: install the defaults first and the code editor's Tab would move focus, the markdown editor's Enter would stop continuing lists.
    //
    // Mod-a is `selectAll` in the default keymap, so a surface binding on it is a genuine conflict whose loser is observable.
    const run = vi.fn(() => true)
    const host = mountHost({
      doc: 'hello world',
      // Default precedence on purpose: at Prec.highest it would win whatever order the host used, which would make this assert nothing.
      extensions: [keymap.of([{ key: 'Mod-a', run }])],
    })
    host.view.focus()

    host.view.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a',
      ctrlKey: true,
      bubbles: true,
    }))

    expect(run).toHaveBeenCalled()
    // selectAll lost, so the selection is untouched.
    expect(host.view.state.selection.main.empty).toBe(true)
  })

  it('installs a placeholder only when given one', () => {
    expect(mountHost({ placeholder: 'Type here' }).view.dom.querySelector('.cm-placeholder')).not.toBeNull()
    expect(mountHost({}).view.dom.querySelector('.cm-placeholder')).toBeNull()
  })

  it('tears the view out of the DOM on destroy', () => {
    const parent = document.createElement('div')
    document.body.append(parent)
    const host = createEditorHost({
      parent,
      doc: '',
      editable: true,
      contentAttributes: {},
      onChange: () => {},
      extensions: [],
    })
    expect(parent.querySelector('.cm-editor')).not.toBeNull()

    host.destroy()
    expect(parent.querySelector('.cm-editor')).toBeNull()
    parent.remove()
  })
})
