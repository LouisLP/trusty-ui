/**
 * The markdown model: what a stretch of text *is*, and what a formatting action does to it. Free of both Vue and CodeMirror, so every rule here is a pure string function tested against strings rather than against an editor.
 *
 * Two halves: `scanMarkdown` is recognition — one pass saying which block each line is and which inline runs it holds. `applyMarkdownAction`, `insertMarkdownLink` and `continueMarkdownLine` are formatting — each returns the next text plus where the selection lands, so the caller only has to dispatch it.
 *
 * A *scanner*, not a parser: no block tree, one block role per line, and inline runs that nest only by re-scanning what sits between a pair of delimiters. Deliberate consequences: `#### ` is not a heading, a quote wins over a heading on the same line, and nothing inside code is scanned for emphasis.
 */

import type { MarkdownToolbarAction } from '../../private/MarkdownToolbar/MarkdownToolbar.actions'

/** What a line is. Every value except `paragraph` is also a `MarkdownToolbarAction`, so the caret's line lights the matching toolbar segment without a lookup table in between. */
export type MarkdownBlock
  = | 'paragraph'
    | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'quote'
    | 'code-block'
    | 'bulleted-list'
    | 'numbered-list'
    /** `---`. The one block with no toolbar segment, so `activeMarkdownActions` skips it. */
    | 'horizontal-rule'

/** An inline run. `link` is recognised and coloured, but it is not a toggle. */
export type MarkdownInline
  = | 'bold'
    | 'italic'
    | 'underline'
    | 'strikethrough'
    | 'inline-code'
    | 'link'

/** A half-open span of the text, in document offsets. */
export interface MarkdownRange {
  from: number
  to: number
}

/** One line, and what it is. Note what is *not* here: where a run of same-block lines starts and ends. Concealing a fence merges its line into its neighbour, so `TrustyMarkdownEditor.editor.ts` works a band's edges out against the lines it actually renders. */
export interface MarkdownLine extends MarkdownRange {
  block: MarkdownBlock
  /** Just past the line's leading syntax — `## `, `> `, `1. ` — and equal to `from` when there is none. A fence line is syntax all the way to its end. */
  contentFrom: number
  /** A ``` line. It carries no content of its own, so hiding it means hiding the whole line. */
  fence: boolean
}

export interface MarkdownInlineSpan extends MarkdownRange {
  role: MarkdownInline
  /** The delimiters themselves, dimmed so the text between them reads as formatted. */
  marks: MarkdownRange[]
  /** A `link`'s target, exactly as written between its parentheses. */
  url?: string
}

export interface MarkdownScan {
  lines: MarkdownLine[]
  inline: MarkdownInlineSpan[]
}

/** The text and where the selection sits in it — a caret being `from === to`. */
export interface MarkdownSelection {
  text: string
  from: number
  to: number
}

/** The next text, and where the selection lands once it is applied. */
export interface MarkdownEdit {
  text: string
  from: number
  to: number
}

/* ── recognition ── */

// Up to three leading spaces and no more: four spaces is an indented code block in every flavour.
const FENCE = /^ {0,3}```/
const HEADING = /^ {0,3}(#{1,3}) +/
const QUOTE = /^ {0,3}> ?/
const BULLETED = /^ *[-*+] +/
const NUMBERED = /^ *\d+\. +/
/** A thematic break: three or more of the same marker and nothing else. Tested before the list markers, since `* * *` is a rule and not three empty bullets. A line-based scanner cannot also honour setext headings, so `---` under a paragraph draws a rule where CommonMark would make the line above it an `<h2>`. */
const RULE = /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/

/** Every inline construct in one alternation. The order of the branches *is* the precedence: `` ` `` wins over everything, `**` wins over the single-character italic, and no two runs can overlap. Both italic delimiters are accepted but must agree — `\k<italicDelimiter>` is what stops `*mixed_` from reading as emphasis. */
const INLINE_PATTERN = new RegExp([
  '(?<code>`[^`\\n]+`)',
  '(?<bold>\\*\\*[^\\s*][^\\n]*?\\*\\*)',
  '(?<strikethrough>~~[^\\s~][^\\n]*?~~)',
  '(?<underline><u>[^\\n]*?</u>)',
  '(?<link>\\[[^\\]\\n]*\\]\\([^)\\s]*\\))',
  '(?<italic>(?<italicDelimiter>[*_])[^\\s*_](?:[^\\n]*?[^\\s*_])?\\k<italicDelimiter>)',
].join('|'), 'g')

/** Which branch of the alternation means which role. */
const INLINE_ROLES: Record<string, MarkdownInline> = {
  code: 'inline-code',
  bold: 'bold',
  strikethrough: 'strikethrough',
  underline: 'underline',
  link: 'link',
  italic: 'italic',
}

/** Delimiter widths at either end. `link` is measured instead — its label varies. */
const INLINE_DELIMITERS: Record<Exclude<MarkdownInline, 'link'>, [open: number, close: number]> = {
  'inline-code': [1, 1],
  'bold': [2, 2],
  'strikethrough': [2, 2],
  'underline': [3, 4],
  'italic': [1, 1],
}

/** The `[` and the `](url)` around a link's label. */
const LINK_LABEL = /^\[[^\]\n]*\]/

function marksFor(role: MarkdownInline, matched: string, from: number, to: number): MarkdownRange[] {
  if (role === 'link') {
    const label = LINK_LABEL.exec(matched)?.[0].length ?? 1
    return [{ from, to: from + 1 }, { from: from + label - 1, to }]
  }

  const [open, close] = INLINE_DELIMITERS[role]
  return [{ from, to: from + open }, { from: to - close, to }]
}

/** The inline runs in one line's content, offset into the whole text. */
function scanInline(content: string, offset: number): MarkdownInlineSpan[] {
  const spans: MarkdownInlineSpan[] = []

  for (const match of content.matchAll(INLINE_PATTERN)) {
    const branch = Object.keys(INLINE_ROLES).find(name => match.groups?.[name] !== undefined)
    if (!branch) {
      continue
    }

    const role = INLINE_ROLES[branch]!
    const from = offset + match.index
    const to = from + match[0].length
    const marks = marksFor(role, match[0], from, to)
    // What sits between a link's parentheses, so a caller need not re-slice the delimiters.
    const url = role === 'link'
      ? match[0].slice(marks[1]!.from - from + 2, match[0].length - 1)
      : undefined
    spans.push({ role, from, to, marks, url })

    // Emphasis nests — `**_both_**` is bold *and* italic — so the run between the delimiters is scanned again. Code is the exception: its content is literal by definition.
    const inner = { from: marks[0]!.to, to: marks[1]!.from }
    if (role !== 'inline-code' && inner.to > inner.from) {
      spans.push(...scanInline(content.slice(inner.from - offset, inner.to - offset), inner.from))
    }
  }

  return spans
}

/** Read the whole text once. Fenced code is the only state carried between lines, which keeps this a single pass with no backtracking. */
export function scanMarkdown(text: string): MarkdownScan {
  const lines: MarkdownLine[] = []
  const inline: MarkdownInlineSpan[] = []
  let offset = 0
  let fenced = false

  for (const raw of text.split('\n')) {
    const from = offset
    const to = from + raw.length
    offset = to + 1

    const fence = FENCE.test(raw)
    if (fence || fenced) {
      // A fence line is syntax end to end; the code between fences is content, deliberately not scanned for emphasis.
      lines.push({ from, to, block: 'code-block', contentFrom: fence ? to : from, fence })
      fenced = fence ? !fenced : fenced
      continue
    }

    const quote = QUOTE.exec(raw)
    const heading = HEADING.exec(raw)
    const rule = RULE.test(raw)
    const numbered = NUMBERED.exec(raw)
    const bulleted = BULLETED.exec(raw)

    let block: MarkdownBlock = 'paragraph'
    let marker = 0
    if (quote) {
      block = 'quote'
      marker = quote[0].length
    }
    else if (heading) {
      block = `heading-${heading[1]!.length}` as MarkdownBlock
      marker = heading[0].length
    }
    else if (rule) {
      // A rule is syntax end to end, like a fence, so the marker is the whole line.
      block = 'horizontal-rule'
      marker = raw.length
    }
    else if (numbered) {
      block = 'numbered-list'
      marker = numbered[0].length
    }
    else if (bulleted) {
      block = 'bulleted-list'
      marker = bulleted[0].length
    }

    lines.push({ from, to, block, contentFrom: from + marker, fence: false })
    inline.push(...scanInline(raw.slice(marker), from + marker))
  }

  return { lines, inline }
}

/** Which formats apply where the selection sits — the toolbar's `active`. A block counts when the selection starts inside it; an inline run counts only when it *contains* the whole selection, so half-selecting a bold word does not claim the segment is on. */
export function activeMarkdownActions(text: string, from: number, to: number): MarkdownToolbarAction[] {
  const { lines, inline } = scanMarkdown(text)
  const actions: MarkdownToolbarAction[] = []

  const line = lines.find(candidate => from <= candidate.to) ?? lines.at(-1)
  // Every other block is also an action; a rule has no segment to press.
  if (line && line.block !== 'paragraph' && line.block !== 'horizontal-rule') {
    actions.push(line.block)
  }

  for (const span of inline) {
    if (span.role !== 'link' && span.from <= from && span.to >= to && !actions.includes(span.role)) {
      actions.push(span.role)
    }
  }

  return actions
}

/** The link the offset sits in, if any — what a modifier-click and Mod+Enter both need. */
export function markdownLinkAt(text: string, offset: number): MarkdownInlineSpan | undefined {
  return scanMarkdown(text).inline.find(span =>
    span.role === 'link' && span.from <= offset && span.to >= offset)
}

/* ── formatting ── */

/** Actions that prefix whole lines, and the family each one is exclusive within. */
const LINE_FAMILIES = {
  'heading-1': 'heading',
  'heading-2': 'heading',
  'heading-3': 'heading',
  'quote': 'quote',
  'bulleted-list': 'list',
  'numbered-list': 'list',
} as const

type LineAction = keyof typeof LINE_FAMILIES

function isLineAction(action: MarkdownToolbarAction): action is LineAction {
  return action in LINE_FAMILIES
}

/** Everything left once the line actions and `code-block` are accounted for: the emphasis that wraps a selection. Total rather than partial, so an action added to the toolbar fails `type-check` here until it has a wrapper instead of being a silent no-op on a live button. */
type InlineAction = Exclude<MarkdownToolbarAction, LineAction | 'code-block' | 'link'>

const INLINE_WRAPPERS: Record<InlineAction, readonly [open: string, close: string]> = {
  'bold': ['**', '**'],
  'italic': ['_', '_'],
  'underline': ['<u>', '</u>'],
  'strikethrough': ['~~', '~~'],
  'inline-code': ['`', '`'],
}

/** Everything a family owns, stripped before the new prefix goes on, which is what makes the toolbar's exclusivity fall out for free. Headings strip up to six `#` so a pasted `##### ` is not left behind as a paragraph's literal text. */
const FAMILY_MARKERS = {
  heading: /^ {0,3}#{1,6} +/,
  quote: /^ {0,3}> ?/,
  list: /^ *(?:[-*+]|\d+\.) +/,
} as const

/** Whether a line already carries exactly this action's marker. */
const LINE_MATCHERS: Record<LineAction, RegExp> = {
  'heading-1': /^ {0,3}# +/,
  'heading-2': /^ {0,3}## +/,
  'heading-3': /^ {0,3}### +/,
  'quote': QUOTE,
  'bulleted-list': BULLETED,
  'numbered-list': NUMBERED,
}

const LINE_PREFIXES: Record<Exclude<LineAction, 'numbered-list'>, string> = {
  'heading-1': '# ',
  'heading-2': '## ',
  'heading-3': '### ',
  'quote': '> ',
  'bulleted-list': '- ',
}

/** A numbered list counts, so its prefix depends on where in the block it is. */
function linePrefix(action: LineAction, index: number): string {
  return action === 'numbered-list' ? `${index + 1}. ` : LINE_PREFIXES[action]
}

const FENCE_OPEN = '```\n'
const FENCE_CLOSE = '\n```'

/** The lines the selection touches, whole. */
function blockAround(text: string, from: number, to: number): MarkdownRange {
  const end = text.indexOf('\n', to)
  return {
    from: text.lastIndexOf('\n', from - 1) + 1,
    to: end === -1 ? text.length : end,
  }
}

/** Wrap the selection, or take the wrapper off. Both sides of the check matter: selecting the word inside `**bold**` means the same as selecting `**bold**` itself. With nothing selected the delimiters go in empty and the caret lands between them. */
function toggleWrapper(
  [open, close]: readonly [string, string],
  { text, from, to }: MarkdownSelection,
): MarkdownEdit {
  if (text.slice(from - open.length, from) === open && text.slice(to, to + close.length) === close) {
    return {
      text: text.slice(0, from - open.length) + text.slice(from, to) + text.slice(to + close.length),
      from: from - open.length,
      to: to - open.length,
    }
  }

  const selected = text.slice(from, to)
  if (selected.length > open.length + close.length && selected.startsWith(open) && selected.endsWith(close)) {
    const inner = selected.slice(open.length, selected.length - close.length)
    return { text: text.slice(0, from) + inner + text.slice(to), from, to: from + inner.length }
  }

  return {
    text: `${text.slice(0, from)}${open}${selected}${close}${text.slice(to)}`,
    from: from + open.length,
    to: to + open.length,
  }
}

/** Rewrite every line the selection touches, carrying the selection onto the result rather than resetting it, so a bolded-then-quoted selection stays the same words. Both of the whole-line transforms below are this plus a per-line rule. */
function rewriteLines(
  { text, from, to }: MarkdownSelection,
  rewrite: (line: string, index: number) => string,
): MarkdownEdit {
  const block = blockAround(text, from, to)
  const lines = text.slice(block.from, block.to).split('\n')

  const deltas: number[] = []
  const rewritten = lines.map((line, index) => {
    const next = rewrite(line, index)
    deltas.push(next.length - line.length)
    return next
  })

  /** The same offset, once its line has grown or shrunk by its prefix. */
  function mapOffset(offset: number): number {
    let lineFrom = block.from
    let shift = 0

    for (const [index, line] of lines.entries()) {
      const lineTo = lineFrom + line.length
      if (offset <= lineTo) {
        // Clamped, so a caret inside a marker that just went away lands at the start of the content rather than before the line.
        const start = lineFrom + shift
        return Math.min(Math.max(offset + shift + deltas[index]!, start), start + rewritten[index]!.length)
      }
      lineFrom = lineTo + 1
      shift += deltas[index]!
    }

    return offset + shift
  }

  return {
    text: text.slice(0, block.from) + rewritten.join('\n') + text.slice(block.to),
    from: mapOffset(from),
    to: mapOffset(to),
  }
}

/** Add the action's prefix to every line the selection touches, or take it off when all of them already have it. */
function toggleLinePrefix(action: LineAction, selection: MarkdownSelection): MarkdownEdit {
  const block = blockAround(selection.text, selection.from, selection.to)
  const lines = selection.text.slice(block.from, block.to).split('\n')
  const family = FAMILY_MARKERS[LINE_FAMILIES[action]]
  const remove = lines.every(line => LINE_MATCHERS[action].test(line))

  return rewriteLines(selection, (line, index) => {
    const stripped = line.replace(family, '')
    return remove ? stripped : linePrefix(action, index) + stripped
  })
}

/** Fence the selected lines, or unfence them. Unfencing drops the fence lines of the run the caret is in, which is why the scan is consulted rather than the selection: the caret is usually inside the code, not on a ``` line. */
function toggleCodeFence({ text, from, to }: MarkdownSelection): MarkdownEdit {
  const { lines } = scanMarkdown(text)
  const index = lines.findIndex(line => from <= line.to)
  const current = lines[index]

  if (!current || current.block !== 'code-block') {
    const block = blockAround(text, from, to)
    return {
      text: `${text.slice(0, block.from)}${FENCE_OPEN}${text.slice(block.from, block.to)}${FENCE_CLOSE}${text.slice(block.to)}`,
      from: from + FENCE_OPEN.length,
      to: to + FENCE_OPEN.length,
    }
  }

  let start = index
  while (start > 0 && lines[start - 1]!.block === 'code-block') {
    start -= 1
  }
  let end = index
  while (end < lines.length - 1 && lines[end + 1]!.block === 'code-block') {
    end += 1
  }

  // The fence lines plus the newline each owns, so unfencing leaves no blank line where a ``` used to be. A closing fence at the end of the text takes the one before it instead.
  const dropped = lines
    .slice(start, end + 1)
    .filter(line => FENCE.test(text.slice(line.from, line.to)))
    .map(line => line.to < text.length
      ? { from: line.from, to: line.to + 1 }
      : { from: Math.max(line.from - 1, 0), to: line.to })

  /** The same offset with the dropped ranges gone; one inside a fence lands at its start. */
  function mapOffset(offset: number): number {
    let next = offset
    for (const range of dropped) {
      if (offset >= range.to) {
        next -= range.to - range.from
      }
      else if (offset > range.from) {
        next -= offset - range.from
      }
    }
    return next
  }

  let kept = ''
  let cursor = 0
  for (const range of dropped) {
    kept += text.slice(cursor, range.from)
    cursor = range.to
  }
  kept += text.slice(cursor)

  return { text: kept, from: mapOffset(from), to: mapOffset(to) }
}

/** What a toolbar press does to the text. `link` is not here: it needs a URL, which the toolbar collects in its popover and reports separately. */
export function applyMarkdownAction(
  action: Exclude<MarkdownToolbarAction, 'link'>,
  selection: MarkdownSelection,
): MarkdownEdit {
  if (isLineAction(action)) {
    return toggleLinePrefix(action, selection)
  }
  if (action === 'code-block') {
    return toggleCodeFence(selection)
  }
  return toggleWrapper(INLINE_WRAPPERS[action], selection)
}

/** `[selected text](url)`, with the caret left after it. The toolbar disables linking while the selection is empty, so the URL only stands in as a label if it somehow is not. */
export function insertMarkdownLink(url: string, { text, from, to }: MarkdownSelection): MarkdownEdit {
  const link = `[${text.slice(from, to) || url}](${url})`
  const caret = from + link.length

  return { text: text.slice(0, from) + link + text.slice(to), from: caret, to: caret }
}

/** The markers Enter carries onto the next line. */
const CONTINUABLE = /^ *(?:[-*+] |\d+\. |> ?)/
const NUMBERED_MARKER = /^( *)(\d+)\. $/

/** What Enter should do inside a list or a quote, or `undefined` when it should do the ordinary thing. An empty item ends the list instead of growing it, which is the only way out that does not involve deleting the bullet by hand. */
export function continueMarkdownLine({ text, from, to }: MarkdownSelection): MarkdownEdit | undefined {
  if (from !== to) {
    return undefined
  }

  const lineEnd = text.indexOf('\n', from)
  const lineFrom = text.lastIndexOf('\n', from - 1) + 1
  const lineTo = lineEnd === -1 ? text.length : lineEnd
  const line = text.slice(lineFrom, lineTo)
  const marker = CONTINUABLE.exec(line)?.[0]

  // Nothing to continue, or the caret is still inside the marker, where splitting the line would cut the bullet in half.
  if (!marker || from < lineFrom + marker.length) {
    return undefined
  }

  if (line.trimEnd() === marker.trimEnd()) {
    return { text: text.slice(0, lineFrom) + text.slice(lineTo), from: lineFrom, to: lineFrom }
  }

  const numbered = NUMBERED_MARKER.exec(marker)
  const insert = `\n${numbered ? `${numbered[1]}${Number(numbered[2]) + 1}. ` : marker}`

  return {
    text: text.slice(0, from) + insert + text.slice(from),
    from: from + insert.length,
    to: from + insert.length,
  }
}

/** A list item's leading indentation and its marker, apart: the indentation is the nesting, and the marker's width is the step, since a child has to reach its parent's content column. */
const LIST_INDENT = /^( *)((?:[-*+]|\d+\.) +)/

/**
 * What Tab and Shift-Tab do to a list, or `undefined` when they should do the ordinary thing.
 *
 * Tab is a field's only way out for a keyboard, so it is taken only where there is nesting to do and given straight back everywhere else. Shift-Tab hands it back at the outer level too, so an item at the top of a list is never a place focus cannot leave backwards.
 *
 * Lines in the selection that are not list items are left exactly as they are.
 */
export function indentMarkdownLines(
  direction: 'in' | 'out',
  selection: MarkdownSelection,
): MarkdownEdit | undefined {
  const block = blockAround(selection.text, selection.from, selection.to)
  const indents = selection.text
    .slice(block.from, block.to)
    .split('\n')
    .map(line => LIST_INDENT.exec(line))

  const movable = indents.some(indent => indent && (direction === 'in' || indent[1]!.length > 0))
  if (!movable) {
    return undefined
  }

  return rewriteLines(selection, (line, index) => {
    const indent = indents[index]
    if (!indent) {
      return line
    }
    const step = indent[2]!.length
    return direction === 'in'
      ? ' '.repeat(step) + line
      : line.slice(Math.min(step, indent[1]!.length))
  })
}
