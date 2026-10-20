/**
 * The Shiki bridge: CodeMirror asks nothing of Lezer here, because Shiki does the tokenizing — the same highlighter, grammars and theme TrustyCodeBlock renders (src/internal/code-highlight), so the read and edit views colour a snippet identically instead of merely similarly.
 *
 * Two pieces: a StateField holding the decorations, and a ViewPlugin that re-tokenizes off the critical path. The field maps its decorations through every edit, so colours travel with the text they cover and are replaced wholesale when fresh tokens land — which is why typing recolours rather than flashing back to plain text.
 */

import type { ThemedToken } from 'shiki/core'
import type { TrustyCodeLanguage } from '../../../internal/code-highlight'
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin } from '@codemirror/view'
import { tokenizeCode } from '../../../internal/code-highlight'

/** Long enough that a fast typist queues one tokenize pass, short enough to feel live. */
const TOKENIZE_DEBOUNCE_MS = 80

// Shiki's FontStyle bit flags, inlined so this module needs no value import from
// @shikijs/types (see FontStyle in shiki's core types).
const FONT_STYLE_ITALIC = 1
const FONT_STYLE_BOLD = 2
const FONT_STYLE_UNDERLINE = 4

const setTokens = StateEffect.define<ReturnType<RangeSetBuilder<Decoration>['finish']>>()

const tokenDecorations = StateField.define({
  create: () => Decoration.none,
  update(decorations, transaction) {
    // Map first: an edit shifts existing colours onto their new offsets, so the document is never briefly uncoloured while the next pass runs.
    let next = decorations.map(transaction.changes)
    for (const effect of transaction.effects) {
      if (effect.is(setTokens)) {
        next = effect.value
      }
    }
    return next
  },
  provide: field => EditorView.decorations.from(field),
})

// One Decoration per distinct style, reused across tokens and passes.
const markCache = new Map<string, Decoration>()

function markFor(token: ThemedToken): Decoration | undefined {
  const declarations: string[] = []
  if (token.color) {
    declarations.push(`color:${token.color}`)
  }
  if (token.fontStyle) {
    if (token.fontStyle & FONT_STYLE_ITALIC) {
      declarations.push('font-style:italic')
    }
    if (token.fontStyle & FONT_STYLE_BOLD) {
      declarations.push('font-weight:bold')
    }
    if (token.fontStyle & FONT_STYLE_UNDERLINE) {
      declarations.push('text-decoration:underline')
    }
  }
  if (!declarations.length) {
    return undefined
  }

  const style = declarations.join(';')
  let mark = markCache.get(style)
  if (!mark) {
    mark = Decoration.mark({ attributes: { style } })
    markCache.set(style, mark)
  }
  return mark
}

/** Walk Shiki's per-line tokens onto document offsets. Tokens are positional — their lengths sum to the line — so offsets come from the document itself rather than from the token metadata. */
function buildDecorations(view: EditorView, lines: ThemedToken[][]) {
  const builder = new RangeSetBuilder<Decoration>()
  const { doc } = view.state

  for (let index = 0; index < lines.length && index < doc.lines; index++) {
    const line = doc.line(index + 1)
    let at = line.from

    for (const token of lines[index]!) {
      const to = Math.min(at + token.content.length, line.to)
      const mark = markFor(token)
      // Whitespace and unstyled tokens carry no decoration; empty ranges would make RangeSetBuilder throw.
      if (mark && to > at) {
        builder.add(at, to, mark)
      }
      at = to
      if (at >= line.to) {
        break
      }
    }
  }

  return builder.finish()
}

/** Colour the document with Shiki, as `language`. Reconfigure this extension (via a Compartment) to change language; pass nothing and the document stays plain. A tokenize failure leaves the text uncoloured rather than breaking the editor. */
export function shikiHighlighting(language: TrustyCodeLanguage | undefined) {
  if (!language) {
    return []
  }
  // Bound as a const so the narrowing survives into the async closure below.
  const lang = language

  const plugin = ViewPlugin.define((view) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    // Only the newest pass may write; an earlier one resolving late is dropped.
    let generation = 0

    function schedule() {
      clearTimeout(timer)
      const pass = ++generation
      timer = setTimeout(async () => {
        const code = view.state.doc.toString()
        try {
          const lines = await tokenizeCode(code, lang)
          if (pass !== generation || view.state.doc.toString() !== code) {
            return
          }
          view.dispatch({ effects: setTokens.of(buildDecorations(view, lines)) })
        }
        catch {
          // Leave whatever the field already holds — plain text at worst.
        }
      }, TOKENIZE_DEBOUNCE_MS)
    }

    schedule()

    return {
      update(update) {
        if (update.docChanged) {
          schedule()
        }
      },
      destroy() {
        clearTimeout(timer)
        generation++
      },
    }
  })

  return [tokenDecorations, plugin]
}
