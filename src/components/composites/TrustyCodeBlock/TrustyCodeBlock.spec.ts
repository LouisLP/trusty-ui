import { EditorView } from '@codemirror/view'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TrustySelect from '../../base/TrustySelect/TrustySelect.vue'
import CodeEditorBase from '../../private/CodeEditorBase/CodeEditorBase.vue'
import TrustyCodeBlock from './TrustyCodeBlock.vue'

const SAMPLE_CODE = '{\n  "type": "variable",\n  "velocity": 25\n}'

// Transforming and importing CodeMirror happens inside the first test that mounts, and on a cold CI runner that alone can outlast Vitest's five-second default.
vi.setConfig({ testTimeout: 20_000 })

function mountCodeBlock(props: Record<string, unknown> = {}) {
  return mount(TrustyCodeBlock, {
    props: { code: SAMPLE_CODE, ...props },
    attachTo: document.body,
  })
}

/** The header button carrying `label` (Edit / Save). */
function actionButton(wrapper: ReturnType<typeof mountCodeBlock>, label: string) {
  return wrapper.findAll('button').find(button => button.text() === label)
}

/** Click Edit and wait for CodeMirror to attach. The first attach of the file pays for CodeMirror's dynamic import — cold, on a CI runner, well past `waitFor`'s one-second default — hence the explicit timeout. */
async function enterEditMode(wrapper: ReturnType<typeof mountCodeBlock>) {
  await actionButton(wrapper, 'Edit')!.trigger('click')
  await vi.waitFor(() => expect(wrapper.find('.cm-content').exists()).toBe(true), { timeout: 10_000 })
}

/** The code CodeMirror holds. Per line: .cm-content's own textContent runs the lines together, and text() would trim the indentation. */
function editorCode(wrapper: ReturnType<typeof mountCodeBlock>) {
  return wrapper.findAll('.cm-line').map(line => line.element.textContent).join('\n')
}

/** The live EditorView, for driving a real edit. */
function editorView(wrapper: ReturnType<typeof mountCodeBlock>) {
  const found = EditorView.findFromDOM(wrapper.get('.cm-editor').element as HTMLElement)
  if (!found) {
    throw new Error('no EditorView attached')
  }
  return found
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('trustyCodeBlock', () => {
  it('renders the code verbatim in a <pre><code>', () => {
    const wrapper = mountCodeBlock()
    expect(wrapper.get('.trusty-code-block-pre code').text()).toBe(SAMPLE_CODE)
  })

  it('renders the language label', () => {
    const wrapper = mountCodeBlock({ language: 'json' })
    expect(wrapper.get('.trusty-code-block-language').text()).toBe('JSON')
  })

  it('syntax-highlights the code when a language is set', async () => {
    const wrapper = mountCodeBlock({ language: 'json' })

    // Highlighting is async (lazy shiki import + grammar load).
    await vi.waitFor(() => {
      expect(wrapper.findAll('.trusty-code-block-pre code span').length).toBeGreaterThan(0)
    })
    expect(wrapper.get('.trusty-code-block-pre code').text()).toContain('"type": "variable"')
  })

  it('renders plain text without a language', () => {
    const wrapper = mountCodeBlock()
    expect(wrapper.findAll('.trusty-code-block-pre code span')).toHaveLength(0)
  })

  it('renders one gutter line number per code line', () => {
    const wrapper = mountCodeBlock()
    expect(wrapper.get('.trusty-code-block-gutter').element.textContent).toBe('1\n2\n3\n4')
  })

  it('keeps the gutter one text block, so its lines cannot drift from the code', () => {
    // A flex column of spans rounds each line to a whole pixel while the code's line boxes keep the fraction — 0.4px per line at 14px/1.4, which is visibly wrong by line 20. Same element type, same layout maths.
    const wrapper = mountCodeBlock()
    const gutter = wrapper.get('.trusty-code-block-gutter')

    expect(gutter.element.tagName).toBe('PRE')
    expect(gutter.findAll('span')).toHaveLength(0)
  })

  it('hides the gutter when lineNumbers is off', () => {
    const wrapper = mountCodeBlock({ lineNumbers: false })
    expect(wrapper.find('.trusty-code-block-gutter').exists()).toBe(false)
  })

  it('hides the gutter from screen readers', () => {
    const wrapper = mountCodeBlock()
    expect(wrapper.get('.trusty-code-block-gutter').attributes('aria-hidden')).toBe('true')
  })

  it('copies the code to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const wrapper = mountCodeBlock()
    await wrapper.get('button').trigger('click')

    expect(writeText).toHaveBeenCalledWith(SAMPLE_CODE)
  })

  // A Storybook or IDE page served over plain HTTP has no `navigator.clipboard`; the copy button must still work there rather than throwing on the click.
  it('copies without the Clipboard API in an insecure context', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand, writable: true })

    const wrapper = mountCodeBlock()
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.get('.trusty-code-block-announce').text()).toBe('Copied to clipboard'))

    expect(execCommand).toHaveBeenCalledWith('copy')
    Reflect.deleteProperty(document, 'execCommand')
  })

  it('announces the copy and resets after a delay', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const wrapper = mountCodeBlock()
    await wrapper.get('button').trigger('click')
    await vi.waitFor(() =>
      expect(wrapper.get('.trusty-code-block-announce').text()).toBe('Copied to clipboard'))
    // A live region hidden from assistive tech announces nothing.
    expect(wrapper.get('.trusty-code-block-announce').attributes('aria-hidden')).toBeUndefined()

    vi.advanceTimersByTime(2000)
    await vi.waitFor(() =>
      expect(wrapper.get('.trusty-code-block-announce').text()).toBe(''))

    vi.useRealTimers()
  })

  it('hides the copy button when copyable is off', () => {
    const wrapper = mountCodeBlock({ copyable: false })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  describe('edit mode', () => {
    it('offers no Edit button unless editable', () => {
      const wrapper = mountCodeBlock()
      expect(actionButton(wrapper, 'Edit')).toBeUndefined()
    })

    it('swaps the read view for the editor on Edit', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      expect(wrapper.find('.trusty-code-block-pre').exists()).toBe(true)

      await enterEditMode(wrapper)

      expect(wrapper.find('.trusty-code-block-pre').exists()).toBe(false)
      expect(editorCode(wrapper)).toBe(SAMPLE_CODE)
    })

    it('replaces Edit with Save while editing', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)

      expect(actionButton(wrapper, 'Edit')).toBeUndefined()
      expect(actionButton(wrapper, 'Save')).toBeDefined()
    })

    it('focuses the editor when it opens', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)

      await vi.waitFor(() =>
        expect(document.activeElement).toBe(wrapper.get('.cm-content').element))
    })

    it('emits the edited code on Save and returns to the read view', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)

      editorView(wrapper).dispatch({ changes: { from: 0, to: SAMPLE_CODE.length, insert: 'edited' } })
      await actionButton(wrapper, 'Save')!.trigger('click')

      expect(wrapper.emitted('submit')?.at(-1)).toEqual(['edited', 'json'])
      expect(wrapper.emitted('update:code')?.at(-1)).toEqual(['edited'])
      expect(wrapper.get('.trusty-code-block-pre code').text()).toBe('edited')
    })

    it('hands focus back to the Edit button after Save', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)

      await actionButton(wrapper, 'Save')!.trigger('click')

      await vi.waitFor(() =>
        expect(document.activeElement).toBe(actionButton(wrapper, 'Edit')!.element))
    })

    it('keeps the draft local until Save', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)

      editorView(wrapper).dispatch({ changes: { from: 0, to: SAMPLE_CODE.length, insert: 'draft' } })

      // Nothing is committed while editing — an abandoned edit costs nothing.
      expect(wrapper.emitted('update:code')).toBeUndefined()
      expect(wrapper.emitted('submit')).toBeUndefined()
    })

    it('copies the draft while editing, not the saved code', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)
      editorView(wrapper).dispatch({ changes: { from: 0, to: SAMPLE_CODE.length, insert: 'draft' } })

      await wrapper.get('button[aria-label="Copy code to clipboard"]').trigger('click')

      expect(writeText).toHaveBeenCalledWith('draft')
    })

    it('swaps the language label for a collapsed ghost select', async () => {
      const wrapper = mountCodeBlock({ editable: true, language: 'json' })
      expect(wrapper.findComponent(TrustySelect).exists()).toBe(false)

      await enterEditMode(wrapper)

      const select = wrapper.getComponent(TrustySelect)
      expect(select.props('variant')).toBe('ghost')
      expect(select.props('modelValue')).toBe('json')
      expect(wrapper.find('.trusty-code-block-language').exists()).toBe(false)
      expect(wrapper.get('[role="combobox"]').attributes('aria-expanded')).toBe('false')
    })

    it('defaults the picker to JSON when no language is set', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)

      expect(wrapper.getComponent(TrustySelect).props('modelValue')).toBe('json')
      expect(wrapper.getComponent(CodeEditorBase).props('language')).toBe('json')
    })

    // Drives the select through its model; the Editing story covers the real click path.
    it('re-highlights the editor as soon as a language is picked', async () => {
      const wrapper = mountCodeBlock({ editable: true, language: 'json' })
      await enterEditMode(wrapper)

      wrapper.getComponent(TrustySelect).vm.$emit('update:modelValue', 'python')
      await wrapper.vm.$nextTick()

      expect(wrapper.getComponent(CodeEditorBase).props('language')).toBe('python')
    })

    it('commits the picked language on Save, not before', async () => {
      const wrapper = mountCodeBlock({ editable: true, language: 'json' })
      await enterEditMode(wrapper)

      wrapper.getComponent(TrustySelect).vm.$emit('update:modelValue', 'python')
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('update:language')).toBeUndefined()

      await actionButton(wrapper, 'Save')!.trigger('click')

      expect(wrapper.emitted('update:language')?.at(-1)).toEqual(['python'])
      expect(wrapper.emitted('submit')?.at(-1)).toEqual([SAMPLE_CODE, 'python'])
      expect(wrapper.get('.trusty-code-block-language').text()).toBe('Python')
    })

    it('emits no update:language when Save keeps the same language', async () => {
      const wrapper = mountCodeBlock({ editable: true, language: 'json' })
      await enterEditMode(wrapper)
      await actionButton(wrapper, 'Save')!.trigger('click')

      expect(wrapper.emitted('update:language')).toBeUndefined()
    })

    it('reopens the editor with the saved code, not the old draft', async () => {
      const wrapper = mountCodeBlock({ editable: true })
      await enterEditMode(wrapper)
      editorView(wrapper).dispatch({ changes: { from: 0, to: SAMPLE_CODE.length, insert: 'first' } })
      await actionButton(wrapper, 'Save')!.trigger('click')

      await enterEditMode(wrapper)

      expect(editorCode(wrapper)).toBe('first')
    })
  })
})
