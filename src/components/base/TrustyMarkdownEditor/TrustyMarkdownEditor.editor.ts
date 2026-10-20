/**
 * The markdown surface: the scan as decorations, the keymap, the link handling.
 *
 * The CodeMirror lifecycle lives in `src/internal/codemirror/editor-host.ts`, shared with `CodeEditorBase.editor.ts` and imported dynamically so a bundle that never mounts a markdown field never ships it (ADR 0001).
 *
 * A `<textarea>` paints one uniform colour, with no hook for a tinted quote band or a dimmed `**`. The scanner in `TrustyMarkdownEditor.markdown.ts` owns every markdown rule; this module only turns its output into decorations, with no Lezer grammar and no `@codemirror/lang-markdown`.
 */

import type { EditorState, Range } from '@codemirror/state'
import type { DecorationSet } from '@codemirror/view'
import type { EditorSurfaceConfig } from '../../../internal/codemirror/useEditorHost'
import type { MarkdownToolbarAction } from '../../private/MarkdownToolbar/MarkdownToolbar.actions'
import type { MarkdownBlock, MarkdownEdit, MarkdownRange, MarkdownSelection } from './TrustyMarkdownEditor.markdown'
import { Prec, StateEffect, StateField } from '@codemirror/state'
import { Decoration, drawSelection, dropCursor, EditorView, keymap, WidgetType } from '@codemirror/view'
import { createEditorHost } from '../../../internal/codemirror/editor-host'
import { markdownShortcutFor } from '../../private/MarkdownToolbar/MarkdownToolbar.actions'
import {
  activeMarkdownActions,
  applyMarkdownAction,
  continueMarkdownLine,
  indentMarkdownLines,
  insertMarkdownLink,
  markdownLinkAt,
  scanMarkdown,
} from './TrustyMarkdownEditor.markdown'
import { markdownEditorTheme, MODIFIER_HELD_CLASS } from './TrustyMarkdownEditor.theme'

/** What the toolbar needs to know about where the caret is. */
export interface MarkdownEditorContext {
  /** The formats that apply there — the toolbar's pressed segments. */
  active: MarkdownToolbarAction[]
  /** Whether anything is selected. Linking needs something to link. */
  hasSelection: boolean
}

export interface MarkdownEditorOptions extends EditorSurfaceConfig {
  placeholder?: string
  onContext: (context: MarkdownEditorContext) => void
}

export interface MarkdownEditorHandle {
  getDoc: () => string
  setDoc: (text: string) => void
  setEditable: (editable: boolean) => void
  setContentAttributes: (attributes: Record<string, string>) => void
  /** Run a toolbar action against the current selection. */
  applyAction: (action: Exclude<MarkdownToolbarAction, 'link'>) => void
  insertLink: (url: string) => void
  focus: () => void
  destroy: () => void
}

/** Revealed syntax: dimmed, but there — the markers the selection has reached. */
const SYNTAX = Decoration.mark({ class: 'cm-md-syntax' })

/** Syntax everywhere else: gone. Not dimmed, not small — removed from the flow. */
const CONCEALED = Decoration.replace({})

/** A list's `-` or `1. `, never concealed and never dimmed: the marker is itself the bullet and the number. Hiding it would leave the item indistinguishable from a paragraph; dimming it would make the list twitch as the caret moved through it. */
const LIST_MARKER = Decoration.mark({ class: 'cm-md-list-marker' })

/** The bullet a bulleted item is drawn with. Markdown spells the marker three ways — `-`, `*`, `+` — and none is the glyph a reader expects, so off the caret's line the character is replaced by one. The replacement is one character wide: the leading indentation and the space after the marker stay real text, so a nested item keeps the depth its source gives it. */
class BulletWidget extends WidgetType {
  toDOM(): HTMLElement {
    const bullet = document.createElement('span')
    bullet.textContent = '•'
    return bullet
  }

  // Every bullet is the same bullet, so CodeMirror can keep the DOM it has.
  eq(): boolean {
    return true
  }

  // A widget swallows its own events by default, which would make the bullet the one place on the line a click could not put the caret.
  ignoreEvent(): boolean {
    return false
  }
}

const BULLET = Decoration.replace({ widget: new BulletWidget() })

/** Which of the three bullet characters an item used, within its marker. */
const BULLET_CHARACTER = /[-*+]/

/** The blocks whose marker is content rather than syntax. */
const LIST_BLOCKS = new Set<MarkdownBlock>(['bulleted-list', 'numbered-list'])

/** The two blocks drawn as a tinted band. A band's half of a block-edge gap falls *inside* its tint, where it reads as padding, so the row on the other side carries the whole gap. */
const BAND_BLOCKS = new Set<MarkdownBlock>(['quote', 'code-block'])

/** The blocks whose lines are packed — no gap between one line and the next, so the run reads as one thing. Everything else is spaced at every line break, because a line break is what a new block is made of. A paragraph that merely wraps is still one line, so it stays packed however tall it grows. */
const PACKED_BLOCKS = new Set<MarkdownBlock>([...BAND_BLOCKS, 'bulleted-list', 'numbered-list'])

/** Whether two neighbouring rendered lines are drawn as one run. */
function packedWith(neighbour: MarkdownBlock | undefined, block: MarkdownBlock): boolean {
  return neighbour === block && PACKED_BLOCKS.has(block)
}

/** Whether the rendered line on one side of this one is a band. */
function isBand(neighbour: MarkdownBlock | undefined): boolean {
  return neighbour !== undefined && BAND_BLOCKS.has(neighbour)
}

/** The schemes a link is allowed to open — the document is user input, so `[x](javascript:…)` would otherwise be a script the field runs on a click. Anything outside this set is drawn as a link and does not open. Relative targets resolve against the page. */
const OPENABLE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** The absolute URL a link's target opens to, or `undefined` if it may not. */
function openableTarget(url: string | undefined): string | undefined {
  if (!url?.trim()) {
    return undefined
  }
  try {
    const resolved = new URL(url.trim(), window.location.href)
    return OPENABLE_SCHEMES.has(resolved.protocol) ? resolved.href : undefined
  }
  catch {
    return undefined
  }
}

/** The attribute the click handler reads back off the DOM. Carrying the target on the decoration makes the hit test exact — the browser says which span was pressed, so a click one character past a link is not a click on it. */
const LINK_TARGET_ATTRIBUTE = 'data-md-href'

/** Open a link the way a browser opens `target="_blank"` — never as a navigation of the host page. */
function openLink(target: string) {
  window.open(target, '_blank', 'noopener,noreferrer')
}

/** Keep that class in step with the modifier. Mouse events carry modifier state too, so a pointer arriving with the key already down is covered without a keydown; `blur` clears it, because the keyup after a Cmd+Tab never arrives. */
function syncModifierHeld(event: KeyboardEvent | MouseEvent, view: EditorView) {
  view.dom.classList.toggle(MODIFIER_HELD_CLASS, event.metaKey || event.ctrlKey)
  return false
}

const modifierCursor = EditorView.domEventHandlers({
  keydown: syncModifierHeld,
  keyup: syncModifierHeld,
  mousemove: syncModifierHeld,
  mouseleave: (_event, view) => {
    view.dom.classList.remove(MODIFIER_HELD_CLASS)
    return false
  },
  blur: (_event, view) => {
    view.dom.classList.remove(MODIFIER_HELD_CLASS)
    return false
  },
})

/** Whether the editable element has focus, as state rather than as a DOM question — decorations are computed from an `EditorState`, which cannot see the view. Without it a fresh editor's caret at offset 0 would leave every unfocused field showing the markers on its first line. */
const setFocused = StateEffect.define<boolean>()

const focusedField = StateField.define<boolean>({
  create: () => false,
  update: (value, transaction) => transaction.effects.reduce(
    (next, effect) => effect.is(setFocused) ? effect.value : next,
    value,
  ),
})

const trackFocus = EditorView.focusChangeEffect.of((_state, focusing) => setFocused.of(focusing))

/**
 * The scan as decorations, against a *state* rather than a document, because what is drawn depends on where the caret is.
 *
 * Markers are concealed until the selection reaches them, the way an outline editor does it. A marker's reach is the width of the thing it describes: a block marker reveals from anywhere on its line, an inline marker only when the selection touches that run, so a caret aimed at one bold word does not rewrite the whole paragraph.
 *
 * A fenced block reveals as a whole run instead — its fences are lines of their own, and concealing one while the caret sat in the code would move the block's edge under the cursor.
 *
 * Re-scanned whole on every change rather than mapped through it: a block's meaning depends on the lines around it (an opened fence recolours everything below), so an incremental pass would be both more code and more wrong.
 */
function decorationsFor(state: EditorState): DecorationSet {
  const text = state.doc.toString()
  const { lines, inline } = scanMarkdown(text)
  const ranges: Range<Decoration>[] = []

  // Nothing is revealed in a field that is not being edited.
  const focused = state.field(focusedField, false) ?? false
  const touches = (from: number, to: number) =>
    focused && state.selection.ranges.some(range => range.from <= to && range.to >= from)

  // Each line's run of same-block neighbours, which is what a fenced block reveals by.
  const runs: MarkdownRange[] = []
  const runOf: MarkdownRange[] = []
  lines.forEach((line, index) => {
    if (lines[index - 1]?.block !== line.block) {
      runs.push({ from: line.from, to: line.to })
    }
    const run = runs.at(-1)!
    run.to = line.to
    runOf.push(run)
  })

  const revealed = lines.map((line, index) => line.block === 'code-block'
    ? touches(runOf[index]!.from, runOf[index]!.to)
    : touches(line.from, line.to))

  // Concealed ranges may not overlap: a fence whose closing fence is the next line would otherwise claim the same newline twice.
  let concealedTo = -1
  function conceal(from: number, to: number) {
    const start = Math.max(from, concealedTo)
    if (to > start) {
      ranges.push(CONCEALED.range(start, to))
      concealedTo = to
    }
  }

  /**
   * The lines CodeMirror will actually render, and what each of them means.
   *
   * A concealed fence takes the line break beside it, so it has no rendered line of its own. The block a rendered line paints is that of the last document line merged into it — the one whose text is on screen — because taking the fence's own block would paint the paragraph under a closing fence as code.
   */
  const rendered: { from: number, block: MarkdownBlock }[] = []
  let pending: { from: number, block: MarkdownBlock } | undefined
  lines.forEach((line, index) => {
    const concealedFence = !revealed[index] && line.fence
    // At the end of the text there is no newline after it to take, so it is swallowed by the line above, which keeps its own attributes.
    const mergesForward = concealedFence && line.to < text.length
    if (concealedFence && !mergesForward) {
      return
    }

    pending = pending ? { from: pending.from, block: line.block } : { from: line.from, block: line.block }
    if (!mergesForward) {
      rendered.push(pending)
      pending = undefined
    }
  })
  if (pending) {
    rendered.push(pending)
  }

  rendered.forEach((line, index) => {
    const classes: string[] = []
    // A paragraph is the absence of a block role and gets no class, but it still starts and ends runs.
    if (line.block !== 'paragraph') {
      classes.push(`cm-md-${line.block}`)
    }
    if (!packedWith(rendered[index - 1]?.block, line.block)) {
      classes.push('cm-md-run-start')
    }
    if (!packedWith(rendered[index + 1]?.block, line.block)) {
      classes.push('cm-md-run-end')
    }
    // And which edges face a band, so the row can carry the gap the band cannot. A band next to a band has nowhere to put it.
    if (!BAND_BLOCKS.has(line.block)) {
      if (isBand(rendered[index - 1]?.block)) {
        classes.push('cm-md-under-band')
      }
      if (isBand(rendered[index + 1]?.block)) {
        classes.push('cm-md-over-band')
      }
    }
    if (classes.length > 0) {
      ranges.push(Decoration.line({ class: classes.join(' ') }).range(line.from))
    }
  })

  lines.forEach((line, index) => {
    if (LIST_BLOCKS.has(line.block)) {
      // Always on screen, revealed or not: see LIST_MARKER.
      if (line.contentFrom > line.from) {
        ranges.push(LIST_MARKER.range(line.from, line.contentFrom))
        // Off the caret's line the marker character itself becomes the bullet; land on the line and the document's own character is back, which is what makes it editable.
        const offset = revealed[index] || line.block !== 'bulleted-list'
          ? -1
          : text.slice(line.from, line.contentFrom).search(BULLET_CHARACTER)
        if (offset >= 0) {
          ranges.push(BULLET.range(line.from + offset, line.from + offset + 1))
        }
      }
    }
    else if (revealed[index]) {
      if (line.contentFrom > line.from) {
        ranges.push(SYNTAX.range(line.from, line.contentFrom))
      }
    }
    else if (line.fence) {
      // The whole line goes, and with it the newline that would be left as a blank line inside the band. A closing fence at the end of the text takes the one before it instead.
      if (line.to < text.length) {
        conceal(line.from, line.to + 1)
      }
      else {
        conceal(Math.max(line.from - 1, 0), line.to)
      }
    }
    else if (line.contentFrom > line.from) {
      conceal(line.from, line.contentFrom)
    }
  })

  for (const span of inline) {
    // A link carries its target twice: as a tooltip, and as the attribute the click handler reads.
    const target = span.role === 'link' ? openableTarget(span.url) : undefined
    ranges.push(Decoration.mark({
      class: `cm-md-${span.role}`,
      attributes: target ? { [LINK_TARGET_ATTRIBUTE]: target, title: target } : undefined,
    }).range(span.from, span.to))

    // By construct, not by line: only the run the selection is in gives its delimiters back. Nested runs contain their children, so a caret inside `**_both_**` reveals both pairs.
    const show = touches(span.from, span.to)
    for (const mark of span.marks) {
      if (mark.to > mark.from) {
        ranges.push((show ? SYNTAX : CONCEALED).range(mark.from, mark.to))
      }
    }
  }

  // Sorted on the way in: decorations are produced per block, not in document order.
  return Decoration.set(ranges, true)
}

/** A StateField, not a ViewPlugin: concealing a fence means a replacing decoration that spans a line break, and CodeMirror only accepts those from the state. It also has to recompute on a bare selection move, which is what a field's update sees. */
const markdownDecorations = StateField.define<DecorationSet>({
  create: state => decorationsFor(state),
  update: (decorations, transaction) => transaction.docChanged
    || transaction.selection
    || transaction.effects.some(effect => effect.is(setFocused))
    ? decorationsFor(transaction.state)
    : decorations,
  provide: field => EditorView.decorations.from(field),
})

export function createMarkdownEditor(options: MarkdownEditorOptions): MarkdownEditorHandle {
  function selectionOf(view: EditorView): MarkdownSelection {
    const { from, to } = view.state.selection.main
    return { text: view.state.doc.toString(), from, to }
  }

  /** Apply an edit the scanner computed. The whole document is replaced in one change, which is the granularity a format toggle wants from undo, and it keeps the history intact unlike a fresh state. */
  function dispatchEdit(view: EditorView, edit: MarkdownEdit) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: edit.text },
      selection: { anchor: edit.from, head: edit.to },
      scrollIntoView: true,
      userEvent: 'input.format',
    })
  }

  /* Highest precedence, so the shortcuts and Enter win over the default keymap. The shortcut table is the toolbar's, so the keys a button announces through aria-keyshortcuts are the keys that work here. Link is the exception: it needs a URL, which only the toolbar's popover can collect. */
  const formatKeys = Prec.highest(EditorView.domEventHandlers({
    keydown: (event, view) => {
      const action = markdownShortcutFor(event)
      if (!action || action === 'link') {
        return false
      }
      dispatchEdit(view, applyMarkdownAction(action, selectionOf(view)))
      return true
    },
  }))

  /**
   * Modifier-click opens a link, the way an IDE opens the file under one — a plain click has to keep meaning "put the caret here". A field that is not editable has no caret to place, so there a plain click opens too.
   *
   * `mousedown`, not `click`: returning true stops CodeMirror from starting the selection drag, so the press does not also move the caret into the link.
   */
  const linkClicks = Prec.highest(EditorView.domEventHandlers({
    mousedown: (event, view) => {
      const modified = event.metaKey || event.ctrlKey
      if (event.button !== 0 || (!modified && view.state.facet(EditorView.editable))) {
        return false
      }

      const target = (event.target as Element | null)
        ?.closest?.(`[${LINK_TARGET_ATTRIBUTE}]`)
        ?.getAttribute(LINK_TARGET_ATTRIBUTE)
      if (!target) {
        return false
      }

      event.preventDefault()
      openLink(target)
      return true
    },
  }))

  /** The same thing from the keyboard, since a modifier-click is not reachable without a pointer. */
  const linkKey = Prec.highest(keymap.of([
    {
      key: 'Mod-Enter',
      run: (view) => {
        const target = openableTarget(markdownLinkAt(view.state.doc.toString(), view.state.selection.main.head)?.url)
        if (!target) {
          return false
        }
        openLink(target)
        return true
      },
    },
  ]))

  /** Tab nests a list item and Shift-Tab lifts it back out. Both fall through to the browser wherever there is no nesting to change, so Tab keeps being the way out of the field from everywhere else. */
  const indentKeys = Prec.highest(keymap.of([
    {
      key: 'Tab',
      run: view => indentList(view, 'in'),
      shift: view => indentList(view, 'out'),
    },
  ]))

  function indentList(view: EditorView, direction: 'in' | 'out'): boolean {
    const edit = indentMarkdownLines(direction, selectionOf(view))
    if (!edit) {
      return false
    }
    dispatchEdit(view, edit)
    return true
  }

  const enterKey = Prec.highest(keymap.of([
    {
      key: 'Enter',
      run: (view) => {
        const edit = continueMarkdownLine(selectionOf(view))
        if (!edit) {
          return false
        }
        dispatchEdit(view, edit)
        return true
      },
    },
  ]))

  const extensions = [
    markdownEditorTheme,
    /* The caret and the selection are drawn by CodeMirror rather than by the browser, which is what puts the caret in the right place: the native caret is positioned by the DOM, so next to a concealed marker it lands above where the text sits. */
    drawSelection(),
    dropCursor(),
    // Before the decorations, which read it.
    focusedField,
    trackFocus,
    markdownDecorations,
    // Prose wraps. Tab is claimed only inside a list (see indentKeys), which is why this surface needs no Esc escape hatch and CodeEditorBase does.
    EditorView.lineWrapping,
    linkKey,
    indentKeys,
    enterKey,
    formatKeys,
    linkClicks,
    modifierCursor,
  ]

  const host = createEditorHost({
    ...options,
    extensions,
    onUpdate: (update) => {
      if (update.docChanged || update.selectionSet) {
        const { from, to } = update.state.selection.main
        options.onContext({
          active: activeMarkdownActions(update.state.doc.toString(), from, to),
          hasSelection: from !== to,
        })
      }
    },
  })

  const { view } = host

  return {
    getDoc: host.getDoc,
    setDoc: host.setDoc,
    setEditable: host.setEditable,
    setContentAttributes: host.setContentAttributes,
    applyAction(action) {
      dispatchEdit(view, applyMarkdownAction(action, selectionOf(view)))
    },
    insertLink(url) {
      dispatchEdit(view, insertMarkdownLink(url, selectionOf(view)))
    },
    focus: host.focus,
    destroy: host.destroy,
  }
}
