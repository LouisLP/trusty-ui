import { EditorView } from '@codemirror/view'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TrustyMarkdownEditor from './TrustyMarkdownEditor.vue'

/**
 * The markdown rules are tested as strings in TrustyMarkdownEditor.markdown.spec.ts. What is left here is the wiring: that a toolbar press reaches the text, that the caret reaches the toolbar, and that the field behaves as a form control.
 *
 * CodeMirror attaches on mount, so every test waits for the editable element to exist. The first mount of the file pays for its dynamic import — cold, on a CI runner, well past `waitFor`'s one-second default — hence the explicit timeouts. jsdom has no layout, so these assert on document state and CodeMirror's DOM contract, never on geometry.
 */

const SAMPLE = 'A paragraph with **bold** in it.'

// Transforming and importing CodeMirror happens inside the first test that mounts, and on a cold CI runner that alone can outlast Vitest's five-second default.
vi.setConfig({ testTimeout: 20_000 })

async function mountEditor(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const wrapper = mount(TrustyMarkdownEditor, {
    props: { modelValue: SAMPLE, ...props },
    attrs,
    attachTo: document.body,
  })
  await vi.waitFor(() => expect(wrapper.find('.cm-content').exists()).toBe(true), { timeout: 10_000 })
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mountEditor>>

/** CodeMirror's editable element. */
function content(wrapper: Wrapper) {
  return wrapper.get('.cm-content')
}

/** The text as CodeMirror holds it. */
function text(wrapper: Wrapper) {
  return wrapper.findAll('.cm-line').map(line => line.element.textContent).join('\n')
}

/** The live EditorView, for driving real edits and selections the way a user would. */
function view(wrapper: Wrapper) {
  const found = EditorView.findFromDOM(wrapper.get('.cm-editor').element as HTMLElement)
  if (!found) {
    throw new Error('no EditorView attached')
  }
  return found
}

/** Put the selection where a user would have dragged it, which means focusing the field first, since nothing is revealed in a field nobody is editing. */
function select(wrapper: Wrapper, from: number, to = from) {
  view(wrapper).focus()
  view(wrapper).dispatch({ selection: { anchor: from, head: to } })
}

/** The lines CodeMirror renders, as `class|text`. Concealing a fence takes a line break with it, so a rendered line is not always a document line. */
function renderedLines(wrapper: Wrapper) {
  return wrapper.findAll('.cm-line').map((line) => {
    const roles = [...line.element.classList].filter(name => name.startsWith('cm-md-')).join(' ')
    return `${roles}|${line.element.textContent}`
  })
}

/** The value the component last pushed back through v-model. */
function emittedValue(wrapper: Wrapper) {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string | undefined
}

/** One toolbar segment, by the accessible name it carries. */
function toolbarButton(wrapper: Wrapper, label: string) {
  return wrapper.get(`[aria-label="${label}"]`)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('trustyMarkdownEditor', () => {
  it('renders the markdown in an editable CodeMirror document', async () => {
    const wrapper = await mountEditor()
    // The document, not the drawn text: unfocused, the `**` is concealed.
    expect(view(wrapper).state.doc.toString()).toBe(SAMPLE)
    expect(content(wrapper).attributes('contenteditable')).toBe('true')
  })

  it('exposes the field as a multiline textbox', async () => {
    const wrapper = await mountEditor()
    expect(content(wrapper).attributes('role')).toBe('textbox')
    expect(content(wrapper).attributes('aria-multiline')).toBe('true')
  })

  it('wears the formatting bar', async () => {
    const wrapper = await mountEditor()
    expect(wrapper.find('[aria-label="Formatting"]').exists()).toBe(true)
  })

  it('pushes an outside model change into the document', async () => {
    const wrapper = await mountEditor()
    await wrapper.setProps({ modelValue: 'replaced' })
    expect(text(wrapper)).toBe('replaced')
  })

  it('emits an edit back through v-model', async () => {
    const wrapper = await mountEditor({ modelValue: 'one' })

    // Dispatching a transaction is how an edit reaches CodeMirror; jsdom does not support synthetic input events on a contenteditable.
    view(wrapper).dispatch({ changes: { from: 3, insert: '\ntwo' } })

    expect(emittedValue(wrapper)).toBe('one\ntwo')
  })

  it('does not echo its own edit back into the document', async () => {
    const wrapper = await mountEditor({ modelValue: 'one' })
    view(wrapper).dispatch({ changes: { from: 3, insert: '!' } })

    await wrapper.setProps({ modelValue: 'one!' })

    expect(text(wrapper)).toBe('one!')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  describe('formatting the text', () => {
    it('applies a toolbar press to the selection', async () => {
      const wrapper = await mountEditor({ modelValue: 'a word' })
      select(wrapper, 2, 6)

      await toolbarButton(wrapper, 'Bold').trigger('click')

      expect(emittedValue(wrapper)).toBe('a **word**')
    })

    it('leaves the selection on the same words afterwards', async () => {
      const wrapper = await mountEditor({ modelValue: 'a word' })
      select(wrapper, 2, 6)
      await toolbarButton(wrapper, 'Bold').trigger('click')

      const { from, to } = view(wrapper).state.selection.main
      expect(view(wrapper).state.doc.sliceString(from, to)).toBe('word')
    })

    it('prefixes the caret\'s line for a block action', async () => {
      const wrapper = await mountEditor({ modelValue: 'a line' })
      select(wrapper, 3)

      await toolbarButton(wrapper, 'Quote').trigger('click')

      expect(emittedValue(wrapper)).toBe('> a line')
    })

    it('inserts a link with the URL the popover reported', async () => {
      const wrapper = await mountEditor({ modelValue: 'see docs' })
      select(wrapper, 4, 8)

      // The popover's own behaviour is MarkdownToolbar's; what matters here is that the URL it confirms reaches the text.
      wrapper.getComponent({ name: 'MarkdownToolbar' }).vm.$emit('link', 'https://x.test')
      await vi.waitFor(() => expect(emittedValue(wrapper)).toBeDefined())

      expect(emittedValue(wrapper)).toBe('see [docs](https://x.test)')
    })

    it('formats from the keyboard with the shortcut the bar announces', async () => {
      const wrapper = await mountEditor({ modelValue: 'a word' })
      select(wrapper, 2, 6)

      content(wrapper).element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }))

      expect(emittedValue(wrapper)).toBe('a **word**')
    })

    it('continues a list on Enter', async () => {
      const wrapper = await mountEditor({ modelValue: '- one' })
      select(wrapper, 5)

      content(wrapper).element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }))

      expect(emittedValue(wrapper)).toBe('- one\n- ')
    })

    it('nests a list item on Tab and lifts it back out on Shift+Tab', async () => {
      const wrapper = await mountEditor({ modelValue: '- one\n- two' })
      select(wrapper, 10)

      const tab = (shiftKey = false) => content(wrapper).element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }),
      )

      // The step is the marker's own width, since that is the column a child item has to reach to be one.
      tab()
      expect(emittedValue(wrapper)).toBe('- one\n  - two')

      tab(true)
      expect(emittedValue(wrapper)).toBe('- one\n- two')
    })

    it('leaves Tab alone where there is no nesting to change', async () => {
      const wrapper = await mountEditor({ modelValue: 'a paragraph' })
      select(wrapper, 2)

      // Not handled means not prevented, which is what lets the browser move focus out of the field.
      const press = (shiftKey = false) => {
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
        content(wrapper).element.dispatchEvent(event)
        return event.defaultPrevented
      }

      expect(press()).toBe(false)
      expect(press(true)).toBe(false)
      expect(emittedValue(wrapper)).toBeUndefined()

      // And at the outer level of a list, Shift+Tab still has to hand it back.
      const list = await mountEditor({ modelValue: '- one' })
      select(list, 5)
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
      content(list).element.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    })

    it('undoes a format in one step', async () => {
      const wrapper = await mountEditor({ modelValue: 'a word' })
      select(wrapper, 2, 6)
      await toolbarButton(wrapper, 'Bold').trigger('click')

      content(wrapper).element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }))

      expect(text(wrapper)).toBe('a word')
    })

    it('keeps focus in the text when the bar is clicked', async () => {
      const wrapper = await mountEditor()
      const bar = wrapper.get('[aria-label="Formatting"]')

      const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      bar.element.dispatchEvent(mousedown)

      // Swallowed, so the browser never moves focus off the selection the press is about to format.
      expect(mousedown.defaultPrevented).toBe(true)
    })
  })

  describe('concealing the syntax', () => {
    it('hides the markers on every line the caret is not on', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title\nsome **bold** text' })
      select(wrapper, 0)

      await vi.waitFor(() => expect(text(wrapper)).toBe('# Title\nsome bold text'))
    })

    it('reveals a block\'s own syntax from anywhere on its line', async () => {
      const wrapper = await mountEditor({ modelValue: '# A rather long title\nsome **bold** text' })
      // The far end of the heading, nowhere near the `# ` itself.
      select(wrapper, 20)

      await vi.waitFor(() => expect(text(wrapper)).toBe('# A rather long title\nsome bold text'))
    })

    it('reveals an inline run\'s delimiters only when the caret is in that run', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title\nsome **bold** text' })
      // Inside the word: 'some ' starts at 8, so the `**` is 13-14 and 'bold' 15-18.
      select(wrapper, 16)

      await vi.waitFor(() => expect(text(wrapper)).toBe('Title\nsome **bold** text'))
    })

    it('leaves an inline run concealed when the caret is elsewhere on its line', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title\nsome **bold** text' })
      // The last word of the same line, which a line-wide reveal would show the `**` of.
      select(wrapper, 24)

      await vi.waitFor(() => expect(text(wrapper)).toBe('Title\nsome bold text'))
    })

    it('reveals nested runs together, since they are one place', async () => {
      const wrapper = await mountEditor({ modelValue: 'a **_both_** b' })
      select(wrapper, 7)

      await vi.waitFor(() => expect(text(wrapper)).toBe('a **_both_** b'))
    })

    it('shows a link\'s label and not its target', async () => {
      const wrapper = await mountEditor({ modelValue: 'a line\nread [the docs](https://x.test) first' })
      select(wrapper, 0)

      await vi.waitFor(() => expect(text(wrapper)).toBe('a line\nread the docs first'))
    })

    it('keeps a link\'s target hidden from the rest of its own line', async () => {
      const wrapper = await mountEditor({ modelValue: 'read [the docs](https://x.test) first' })
      // In 'first', past the link.
      select(wrapper, 34)

      await vi.waitFor(() => expect(text(wrapper)).toBe('read the docs first'))
    })

    it('hides a fenced block\'s fences, and the blank lines they would leave', async () => {
      const wrapper = await mountEditor({ modelValue: 'before\n```\ncode\n```\nafter' })
      select(wrapper, 0)

      await vi.waitFor(() => expect(text(wrapper)).toBe('before\ncode\nafter'))
    })

    it('reveals a fenced block as a whole, from anywhere inside it', async () => {
      const wrapper = await mountEditor({ modelValue: 'before\n```\ncode\n```\nafter' })
      select(wrapper, 13)

      await vi.waitFor(() => expect(text(wrapper)).toBe('before\n```\ncode\n```\nafter'))
    })

    it('keeps a list\'s markers on screen, caret or no caret', async () => {
      const wrapper = await mountEditor({ modelValue: '- one\n- two\n\n1. first\n2. second' })

      // Not focused at all, so every other marker would be gone. A bulleted item's marker is drawn as the bullet it means; a number already is that, so it is left alone.
      await vi.waitFor(() => expect(text(wrapper)).toBe('• one\n• two\n\n1. first\n2. second'))

      select(wrapper, 0)
      await vi.waitFor(() => expect(text(wrapper)).toBe('- one\n• two\n\n1. first\n2. second'))
    })

    it('gives a bulleted item its own character back at the caret, and never rewrites it', async () => {
      const wrapper = await mountEditor({ modelValue: '- one\n- two' })
      await vi.waitFor(() => expect(text(wrapper)).toBe('• one\n• two'))

      // The caret's line is source again; its neighbour is still drawn.
      select(wrapper, 3)
      await vi.waitFor(() => expect(text(wrapper)).toBe('- one\n• two'))

      // The bullet is drawn, never typed: the document holds the markdown character the consumer stores.
      expect(view(wrapper).state.doc.toString()).toBe('- one\n- two')
      expect(emittedValue(wrapper)).toBeUndefined()
    })

    it('draws all three spellings of a bullet alike, and keeps a nested item\'s depth', async () => {
      const wrapper = await mountEditor({ modelValue: '- one\n* two\n+ three\n  - nested' })

      // Only the marker character is replaced, so the indentation that nests the last item is still the document's own spaces.
      await vi.waitFor(() => expect(text(wrapper)).toBe('• one\n• two\n• three\n  • nested'))
    })

    it('reveals nothing while the field is not focused', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title\nsome **bold** text' })

      // A fresh editor holds its caret at offset 0, which must not reveal the first line of a field nobody is editing.
      await vi.waitFor(() => expect(text(wrapper)).toBe('Title\nsome bold text'))
    })

    it('conceals the caret\'s line again when the field is blurred', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title\nsome **bold** text' })
      select(wrapper, 2)
      await vi.waitFor(() => expect(text(wrapper)).toBe('# Title\nsome bold text'))

      view(wrapper).contentDOM.blur()
      await vi.waitFor(() => expect(text(wrapper)).toBe('Title\nsome bold text'))
    })

    it('draws a rule as an empty line carrying the border, and reveals its dashes', async () => {
      const wrapper = await mountEditor({ modelValue: 'above\n---\nbelow' })
      select(wrapper, 0)

      await vi.waitFor(() => {
        expect(text(wrapper)).toBe('above\n\nbelow')
        expect(wrapper.find('.cm-md-horizontal-rule').exists()).toBe(true)
      })

      select(wrapper, 7)
      await vi.waitFor(() => expect(text(wrapper)).toBe('above\n---\nbelow'))
    })

    it('keeps every backtick of a fence on screen while it is being typed', async () => {
      const wrapper = await mountEditor({ modelValue: 'note\n' })
      const editor = view(wrapper)
      editor.focus()

      // One at a time, the way they arrive from the keyboard: a fence is only a fence at the third character.
      for (const expected of ['`', '``', '```']) {
        const at = editor.state.doc.length
        editor.dispatch({ changes: { from: at, insert: '`' }, selection: { anchor: at + 1 } })
        await vi.waitFor(() => expect(text(wrapper)).toBe(`note\n${expected}`))
      }
    })

    it('draws a concealed fenced block as one row, rounded at both ends', async () => {
      const wrapper = await mountEditor({ modelValue: '```\ncode\n```\n\nafter' })

      await vi.waitFor(() => expect(renderedLines(wrapper)).toEqual([
        'cm-md-code-block cm-md-run-start cm-md-run-end|code',
        // The blank line and the paragraph are the user's, and neither is code. They carry no block class, only the run edges every line break gets, plus — on the row against the band — the gap the band's own tint cannot show.
        'cm-md-run-start cm-md-run-end cm-md-under-band|',
        'cm-md-run-start cm-md-run-end|after',
      ]))
    })

    it('keeps the whole block once the caret is inside it', async () => {
      const wrapper = await mountEditor({ modelValue: '```\ncode\n```\n\nafter' })
      select(wrapper, 5)

      await vi.waitFor(() => expect(renderedLines(wrapper)).toEqual([
        'cm-md-code-block cm-md-run-start|```',
        'cm-md-code-block|code',
        'cm-md-code-block cm-md-run-end|```',
        'cm-md-run-start cm-md-run-end cm-md-under-band|',
        'cm-md-run-start cm-md-run-end|after',
      ]))
    })

    it('marks every line break between blocks, and packs a band or a list', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title\nso if\nI have\na paragraph\n- item\n- item' })

      // The gap the theme hangs off these edges is what separates a heading from its paragraph and the prose from the list. Each typed break makes its own paragraph, so each carries both edges; a list is the other way round, since its items are one thing.
      await vi.waitFor(() => expect(renderedLines(wrapper)).toEqual([
        'cm-md-heading-1 cm-md-run-start cm-md-run-end|Title',
        'cm-md-run-start cm-md-run-end|so if',
        'cm-md-run-start cm-md-run-end|I have',
        'cm-md-run-start cm-md-run-end|a paragraph',
        'cm-md-bulleted-list cm-md-run-start|• item',
        'cm-md-bulleted-list cm-md-run-end|• item',
      ]))
    })

    it('hands the gap at a band\'s edge to the row that can show it', async () => {
      const wrapper = await mountEditor({ modelValue: 'before\n> quoted\nafter' })

      // A band's own half-gap is under its tint, where it reads as padding rather than as air, so the rows on either side carry the whole gap instead.
      await vi.waitFor(() => expect(renderedLines(wrapper)).toEqual([
        'cm-md-run-start cm-md-run-end cm-md-over-band|before',
        'cm-md-quote cm-md-run-start cm-md-run-end|quoted',
        'cm-md-run-start cm-md-run-end cm-md-under-band|after',
      ]))
    })

    it('rounds a quote band at the ends of its run and nowhere else', async () => {
      const wrapper = await mountEditor({ modelValue: '> one\n> two\n> three' })

      await vi.waitFor(() => expect(renderedLines(wrapper)).toEqual([
        'cm-md-quote cm-md-run-start|one',
        'cm-md-quote|two',
        'cm-md-quote cm-md-run-end|three',
      ]))
    })

    it('leaves the document itself untouched — only what is drawn changes', async () => {
      const wrapper = await mountEditor({ modelValue: '# Title' })
      select(wrapper, 0)
      await vi.waitFor(() => expect(text(wrapper)).toBe('# Title'))

      select(wrapper, 5)
      await vi.waitFor(() => expect(text(wrapper)).toBe('# Title'))
      expect(view(wrapper).state.doc.toString()).toBe('# Title')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  it('draws its own caret and selection, rather than the browser\'s', async () => {
    // The native caret is placed by the DOM, so beside a concealed marker it lands above the text it belongs to.
    const wrapper = await mountEditor()
    expect(wrapper.find('.cm-cursorLayer').exists()).toBe(true)
    expect(wrapper.find('.cm-selectionLayer').exists()).toBe(true)
  })

  describe('opening a link', () => {
    const DOC = 'read [the docs](https://x.test) first'

    /** The element the link decoration put its target on. */
    function link(wrapper: Wrapper) {
      return wrapper.get('[data-md-href]')
    }

    function press(wrapper: Wrapper, init: MouseEventInit = {}) {
      link(wrapper).element.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ...init }),
      )
    }

    it('carries the resolved target, and shows it as a tooltip', async () => {
      const wrapper = await mountEditor({ modelValue: DOC })
      await vi.waitFor(() => expect(link(wrapper).attributes('data-md-href')).toBe('https://x.test/'))
      expect(link(wrapper).attributes('title')).toBe('https://x.test/')
    })

    it('opens in a new tab on a modifier-click, and not on a plain one', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null)
      const wrapper = await mountEditor({ modelValue: DOC })
      await vi.waitFor(() => expect(wrapper.find('[data-md-href]').exists()).toBe(true))

      // A plain click has to keep meaning "put the caret here"; CodeMirror's own handler takes it, so only whether the link opened is ours to assert.
      press(wrapper)
      expect(open).not.toHaveBeenCalled()

      press(wrapper, { metaKey: true })
      expect(open).toHaveBeenCalledWith('https://x.test/', '_blank', 'noopener,noreferrer')

      press(wrapper, { ctrlKey: true })
      expect(open).toHaveBeenCalledTimes(2)
    })

    it('marks the editor while a modifier is held, so the cursor can turn into a pointer', async () => {
      const wrapper = await mountEditor({ modelValue: DOC })
      const editor = wrapper.get('.cm-editor').element

      content(wrapper).element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', metaKey: true, bubbles: true }))
      expect(editor.classList.contains('cm-md-modifier-held')).toBe(true)

      content(wrapper).element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', bubbles: true }))
      expect(editor.classList.contains('cm-md-modifier-held')).toBe(false)

      // A pointer that arrives with the key already down never sees the keydown.
      content(wrapper).element.dispatchEvent(new MouseEvent('mousemove', { ctrlKey: true, bubbles: true }))
      expect(editor.classList.contains('cm-md-modifier-held')).toBe(true)

      // The keyup after a Cmd+Tab never comes, so losing focus has to clear it.
      content(wrapper).element.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
      expect(editor.classList.contains('cm-md-modifier-held')).toBe(false)
    })

    it('opens on a plain click when there is no caret to place', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null)
      const wrapper = await mountEditor({ modelValue: DOC, disabled: true })
      await vi.waitFor(() => expect(wrapper.find('[data-md-href]').exists()).toBe(true))

      press(wrapper)
      expect(open).toHaveBeenCalledWith('https://x.test/', '_blank', 'noopener,noreferrer')
    })

    it('opens the link at the caret from the keyboard', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null)
      const wrapper = await mountEditor({ modelValue: DOC })
      select(wrapper, 8)

      content(wrapper).element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }))

      expect(open).toHaveBeenCalledWith('https://x.test/', '_blank', 'noopener,noreferrer')
    })

    it('will not open a scheme that is not a link', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null)
      const wrapper = await mountEditor({ modelValue: 'a [trap](javascript:alert(1)) here' })
      await vi.waitFor(() => expect(wrapper.find('.cm-md-link').exists()).toBe(true))

      // Drawn as a link, but with no target to open — so nothing can run it.
      expect(wrapper.find('[data-md-href]').exists()).toBe(false)
      select(wrapper, 4)
      content(wrapper).element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }))
      expect(open).not.toHaveBeenCalled()
    })
  })

  describe('reporting the caret back to the bar', () => {
    it('presses the segments for the formats at the caret', async () => {
      const wrapper = await mountEditor({ modelValue: '## a **b** c' })
      select(wrapper, 8)
      await vi.waitFor(() =>
        expect(toolbarButton(wrapper, 'Bold').attributes('aria-pressed')).toBe('true'))

      expect(toolbarButton(wrapper, 'Heading 2').attributes('aria-pressed')).toBe('true')
      expect(toolbarButton(wrapper, 'Italic').attributes('aria-pressed')).toBe('false')
    })

    it('releases them again when the caret leaves', async () => {
      const wrapper = await mountEditor({ modelValue: '## heading\nplain' })
      select(wrapper, 2)
      await vi.waitFor(() =>
        expect(toolbarButton(wrapper, 'Heading 2').attributes('aria-pressed')).toBe('true'))

      select(wrapper, 13)
      await vi.waitFor(() =>
        expect(toolbarButton(wrapper, 'Heading 2').attributes('aria-pressed')).toBe('false'))
    })

    it('disables linking while there is nothing to link', async () => {
      const wrapper = await mountEditor()
      expect(toolbarButton(wrapper, 'Link').attributes('disabled')).toBeDefined()
    })

    it('enables it once something is selected', async () => {
      const wrapper = await mountEditor()
      select(wrapper, 0, 4)
      await vi.waitFor(() =>
        expect(toolbarButton(wrapper, 'Link').attributes('disabled')).toBeUndefined())
    })
  })

  describe('form control contract', () => {
    it('marks the field invalid', async () => {
      const wrapper = await mountEditor({ invalid: true })
      expect(content(wrapper).attributes('aria-invalid')).toBe('true')
      expect(wrapper.get('.trusty-markdown-editor').attributes('data-invalid')).toBe('true')
    })

    it('marks the field required', async () => {
      const wrapper = await mountEditor({ required: true })
      expect(content(wrapper).attributes('aria-required')).toBe('true')
    })

    it('stops accepting edits when disabled, bar included', async () => {
      const wrapper = await mountEditor({ disabled: true })
      expect(content(wrapper).attributes('contenteditable')).toBe('false')
      expect(wrapper.get('.trusty-markdown-editor').attributes('data-disabled')).toBe('true')
      expect(toolbarButton(wrapper, 'Bold').attributes('disabled')).toBeDefined()
    })

    it('re-enables editing when disabled is lifted', async () => {
      const wrapper = await mountEditor({ disabled: true })
      await wrapper.setProps({ disabled: false })
      await vi.waitFor(() =>
        expect(content(wrapper).attributes('contenteditable')).toBe('true'))
    })

    it('forwards labelling attributes onto the textbox, not the wrapper', async () => {
      const wrapper = await mountEditor({}, { 'id': 'notes', 'aria-describedby': 'notes-hint' })

      expect(content(wrapper).attributes('id')).toBe('notes')
      expect(content(wrapper).attributes('aria-describedby')).toBe('notes-hint')
      expect(wrapper.get('.trusty-markdown-editor').attributes('id')).toBeUndefined()
    })

    it('keeps other attributes on the root', async () => {
      const wrapper = await mountEditor({}, { 'data-testid': 'notes' })
      expect(wrapper.get('.trusty-markdown-editor').attributes('data-testid')).toBe('notes')
    })

    it('renders the placeholder while empty', async () => {
      const wrapper = await mountEditor({ modelValue: '', placeholder: 'Add a note…' })
      expect(wrapper.get('.cm-placeholder').text()).toBe('Add a note…')
    })

    it('exposes focus()', async () => {
      const wrapper = await mountEditor()
      expect(typeof (wrapper.vm as unknown as { focus: () => void }).focus).toBe('function')
    })
  })
})
