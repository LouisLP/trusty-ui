import { EditorView } from '@codemirror/view'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CodeEditorBase from './CodeEditorBase.vue'

const SAMPLE_CODE = '{\n  "type": "variable",\n  "velocity": 25\n}'

// Transforming and importing CodeMirror happens inside the first test that mounts, and on a cold CI runner that alone can outlast Vitest's five-second default.
vi.setConfig({ testTimeout: 20_000 })

/** CodeMirror is imported dynamically and attaches on mount, so every test waits for the editable element to exist. The first mount of the run pays for that import — cold, on a CI runner, well past `waitFor`'s one-second default — hence the explicit timeout. jsdom has no layout, so these assert on document state and CodeMirror's own DOM contract — never on geometry. */
async function mountEditor(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const wrapper = mount(CodeEditorBase, {
    props: { modelValue: SAMPLE_CODE, ...props },
    attrs,
    attachTo: document.body,
  })
  await vi.waitFor(() => expect(wrapper.find('.cm-content').exists()).toBe(true), { timeout: 10_000 })
  return wrapper
}

/** CodeMirror's editable element. */
function content(wrapper: Awaited<ReturnType<typeof mountEditor>>) {
  return wrapper.get('.cm-content')
}

/** The code as CodeMirror holds it. textContent, not text(): text() trims the indentation, which is exactly what this component must not lose. */
function code(wrapper: Awaited<ReturnType<typeof mountEditor>>) {
  return wrapper.findAll('.cm-line').map(line => line.element.textContent).join('\n')
}

/** The live EditorView, for driving real edits the way a user would. */
function view(wrapper: Awaited<ReturnType<typeof mountEditor>>) {
  const found = EditorView.findFromDOM(wrapper.get('.cm-editor').element as HTMLElement)
  if (!found) {
    throw new Error('no EditorView attached')
  }
  return found
}

/** The value the component last pushed back through v-model. */
function emittedValue(wrapper: Awaited<ReturnType<typeof mountEditor>>) {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string | undefined
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('trustyCodeEditor', () => {
  it('renders the code in an editable CodeMirror document', async () => {
    const wrapper = await mountEditor()
    expect(code(wrapper)).toBe(SAMPLE_CODE)
    expect(content(wrapper).attributes('contenteditable')).toBe('true')
  })

  it('exposes the code as a multiline textbox', async () => {
    const wrapper = await mountEditor()
    expect(content(wrapper).attributes('role')).toBe('textbox')
    expect(content(wrapper).attributes('aria-multiline')).toBe('true')
  })

  it('pushes an outside model change into the document', async () => {
    const wrapper = await mountEditor()
    await wrapper.setProps({ modelValue: 'replaced' })
    expect(code(wrapper)).toBe('replaced')
  })

  it('emits an edit back through v-model', async () => {
    const wrapper = await mountEditor({ modelValue: 'one' })

    // Dispatching a transaction is how an edit reaches CodeMirror; synthetic input events on a contenteditable are not supported in jsdom.
    view(wrapper).dispatch({ changes: { from: 3, insert: '\ntwo' } })

    expect(emittedValue(wrapper)).toBe('one\ntwo')
  })

  it('does not echo its own edit back into the document', async () => {
    const wrapper = await mountEditor({ modelValue: 'one' })
    view(wrapper).dispatch({ changes: { from: 3, insert: '!' } })

    // The parent syncing the emitted value back must not re-dispatch it.
    await wrapper.setProps({ modelValue: 'one!' })

    expect(code(wrapper)).toBe('one!')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('indents with Tab and outdents with Shift+Tab', async () => {
    const wrapper = await mountEditor({ modelValue: 'line' })
    const editable = content(wrapper).element as HTMLElement

    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(code(wrapper)).toBe('  line')

    editable.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    }))
    expect(code(wrapper)).toBe('line')
  })

  it('lets Tab move focus once Esc has armed the escape hatch', async () => {
    const wrapper = await mountEditor({ modelValue: 'line' })
    const editable = content(wrapper).element as HTMLElement

    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    editable.dispatchEvent(tab)

    // Unhandled: no indentation, and the browser is free to move focus.
    expect(code(wrapper)).toBe('line')
    expect(tab.defaultPrevented).toBe(false)
  })

  it('re-arms indentation after the escape hatch is used', async () => {
    const wrapper = await mountEditor({ modelValue: 'line' })
    const editable = content(wrapper).element as HTMLElement

    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

    expect(code(wrapper)).toBe('  line')
  })

  it('closes the escape hatch again when the user keeps typing', async () => {
    const wrapper = await mountEditor({ modelValue: 'line' })
    const editable = content(wrapper).element as HTMLElement

    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }))
    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

    expect(code(wrapper)).toBe('  line')
  })

  it('renders the line-number gutter', async () => {
    const wrapper = await mountEditor()
    expect(wrapper.findAll('.cm-lineNumbers .cm-gutterElement').length).toBeGreaterThan(0)
  })

  it('hides the gutter when lineNumbers is off', async () => {
    const wrapper = await mountEditor({ lineNumbers: false })
    expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false)
  })

  it('adds and removes the gutter when the prop changes', async () => {
    const wrapper = await mountEditor({ lineNumbers: false })

    await wrapper.setProps({ lineNumbers: true })
    await vi.waitFor(() => expect(wrapper.find('.cm-lineNumbers').exists()).toBe(true))

    await wrapper.setProps({ lineNumbers: false })
    await vi.waitFor(() => expect(wrapper.find('.cm-lineNumbers').exists()).toBe(false))
  })

  it('colours the code with the shared Shiki tokens', async () => {
    const wrapper = await mountEditor({ language: 'json' })

    // Tokenizing is debounced, then lazily loads shiki and the grammar.
    await vi.waitFor(
      () => expect(content(wrapper).element.querySelectorAll('span[style*="color"]').length)
        .toBeGreaterThan(0),
      { timeout: 5000 },
    )
    // The document is untouched by highlighting — decorations only wrap it.
    expect(code(wrapper)).toBe(SAMPLE_CODE)
  })

  it('leaves the code uncoloured without a language', async () => {
    const wrapper = await mountEditor()
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(content(wrapper).element.querySelectorAll('span[style*="color"]')).toHaveLength(0)
  })

  describe('form control contract', () => {
    it('marks the field invalid', async () => {
      const wrapper = await mountEditor({ invalid: true })
      expect(content(wrapper).attributes('aria-invalid')).toBe('true')
      expect(wrapper.get('.code-editor-base').attributes('data-invalid')).toBe('true')
    })

    it('marks the field required', async () => {
      const wrapper = await mountEditor({ required: true })
      expect(content(wrapper).attributes('aria-required')).toBe('true')
    })

    it('stops accepting edits when disabled', async () => {
      const wrapper = await mountEditor({ disabled: true })
      expect(content(wrapper).attributes('contenteditable')).toBe('false')
      expect(wrapper.get('.code-editor-base').attributes('data-disabled')).toBe('true')
    })

    it('re-enables editing when disabled is lifted', async () => {
      const wrapper = await mountEditor({ disabled: true })
      await wrapper.setProps({ disabled: false })
      await vi.waitFor(() =>
        expect(content(wrapper).attributes('contenteditable')).toBe('true'))
    })

    it('forwards labelling attributes onto the textbox, not the wrapper', async () => {
      const wrapper = await mountEditor({}, { 'id': 'payload', 'aria-describedby': 'payload-hint' })

      expect(content(wrapper).attributes('id')).toBe('payload')
      expect(content(wrapper).attributes('aria-describedby')).toBe('payload-hint')
      expect(wrapper.get('.code-editor-base').attributes('id')).toBeUndefined()
    })

    it('keeps other attributes on the root', async () => {
      const wrapper = await mountEditor({}, { 'data-testid': 'editor' })
      expect(wrapper.get('.code-editor-base').attributes('data-testid')).toBe('editor')
    })

    it('takes focus on attach when the host asks it to', async () => {
      const wrapper = await mountEditor({ focusOnAttach: true })
      await vi.waitFor(() =>
        expect(document.activeElement).toBe(content(wrapper).element))
    })

    it('does not take focus otherwise', async () => {
      const wrapper = await mountEditor()
      expect(document.activeElement).not.toBe(content(wrapper).element)
    })

    it('renders the placeholder while empty', async () => {
      const wrapper = await mountEditor({ modelValue: '', placeholder: 'Paste a payload…' })
      expect(wrapper.get('.cm-placeholder').text()).toBe('Paste a payload…')
    })

    it('exposes focus()', async () => {
      const wrapper = await mountEditor()
      expect(typeof (wrapper.vm as unknown as { focus: () => void }).focus).toBe('function')
    })
  })
})
