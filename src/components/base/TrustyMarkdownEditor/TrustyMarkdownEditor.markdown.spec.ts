import { describe, expect, it } from 'vitest'
import {
  activeMarkdownActions,
  applyMarkdownAction,
  continueMarkdownLine,
  indentMarkdownLines,
  insertMarkdownLink,
  markdownLinkAt,
  scanMarkdown,
} from './TrustyMarkdownEditor.markdown'

/** The markdown model is pure string functions, so it is tested as such — no editor, no DOM. Everything CodeMirror does with these results is exercised in TrustyMarkdownEditor.spec.ts. */

/** The blocks a text scans as, one per line — the shape most assertions want. */
function blocks(text: string) {
  return scanMarkdown(text).lines.map(line => line.block)
}

/** The inline runs as `role:text`, so the offsets are checked against the text. */
function runs(text: string) {
  return scanMarkdown(text).inline.map(span => `${span.role}:${text.slice(span.from, span.to)}`)
}

/** An edit rendered as the text with the resulting selection marked. */
function applied(action: Parameters<typeof applyMarkdownAction>[0], text: string, from: number, to = from) {
  const edit = applyMarkdownAction(action, { text, from, to })
  return `${edit.text.slice(0, edit.from)}[${edit.text.slice(edit.from, edit.to)}]${edit.text.slice(edit.to)}`
}

describe('scanMarkdown', () => {
  it('recognises the three heading levels', () => {
    expect(blocks('# one\n## two\n### three')).toEqual(['heading-1', 'heading-2', 'heading-3'])
  })

  it('leaves a fourth level as a paragraph, since the toolbar offers three', () => {
    expect(blocks('#### four')).toEqual(['paragraph'])
  })

  it('needs a space after the hashes', () => {
    expect(blocks('#hashtag')).toEqual(['paragraph'])
  })

  it('recognises quotes, both list kinds, and plain lines', () => {
    expect(blocks('> quoted\n- bullet\n1. numbered\nplain')).toEqual([
      'quote',
      'bulleted-list',
      'numbered-list',
      'paragraph',
    ])
  })

  it('recognises a thematic break, whichever marker draws it', () => {
    expect(blocks('---\n***\n___\n* * *\n- - -')).toEqual([
      'horizontal-rule',
      'horizontal-rule',
      'horizontal-rule',
      'horizontal-rule',
      'horizontal-rule',
    ])
  })

  it('needs three markers and nothing else on the line', () => {
    expect(blocks('--\n--- text\n-')).toEqual(['paragraph', 'paragraph', 'paragraph'])
  })

  it('reads a rule before a bullet, so `* * *` is not three empty items', () => {
    expect(blocks('* * *')).toEqual(['horizontal-rule'])
  })

  it('treats a rule as syntax end to end, the way a fence is', () => {
    const [rule] = scanMarkdown('---').lines
    expect(rule?.contentFrom).toBe(rule?.to)
  })

  it('runs a fenced block from its opening fence to its closing one', () => {
    expect(blocks('before\n```\ncode\n```\nafter')).toEqual([
      'paragraph',
      'code-block',
      'code-block',
      'code-block',
      'paragraph',
    ])
  })

  it('treats an unterminated fence as code all the way down', () => {
    expect(blocks('```\none\ntwo')).toEqual(['code-block', 'code-block', 'code-block'])
  })

  it('reports the leading syntax so it can be dimmed', () => {
    const [heading] = scanMarkdown('## title').lines
    expect(heading?.contentFrom).toBe(3)
  })

  it('treats a whole fence line as syntax, and says which lines those are', () => {
    const { lines } = scanMarkdown('```\ncode\n```')
    expect(lines.map(line => line.fence)).toEqual([true, false, true])
    expect(lines[0]?.contentFrom).toBe(lines[0]?.to)
  })

  it('recognises every inline run', () => {
    expect(runs('a **b** _c_ ~~d~~ <u>e</u> `f` [g](h)')).toEqual([
      'bold:**b**',
      'italic:_c_',
      'strikethrough:~~d~~',
      'underline:<u>e</u>',
      'inline-code:`f`',
      'link:[g](h)',
    ])
  })

  it('reads ** as bold rather than as two italics', () => {
    expect(runs('**bold**')).toEqual(['bold:**bold**'])
  })

  it('takes asterisks and underscores as italic, but not a mismatched pair', () => {
    expect(runs('*one* _two_')).toEqual(['italic:*one*', 'italic:_two_'])
    expect(runs('*mixed_')).toEqual([])
  })

  it('holds no emphasis inside inline code', () => {
    expect(runs('`**not bold**`')).toEqual(['inline-code:`**not bold**`'])
  })

  it('scans no emphasis inside a fenced block', () => {
    expect(runs('```\n**not bold**\n```')).toEqual([])
  })

  it('scans the content of a heading or a list item', () => {
    expect(runs('# a **b**')).toEqual(['bold:**b**'])
    expect(runs('- a **b**')).toEqual(['bold:**b**'])
  })

  it('marks a link\'s brackets and target as syntax, not its label', () => {
    const [link] = scanMarkdown('[label](url)').inline
    expect(link?.marks).toEqual([{ from: 0, to: 1 }, { from: 6, to: 12 }])
  })

  it('marks emphasis delimiters at both ends', () => {
    const [bold] = scanMarkdown('**b**').inline
    expect(bold?.marks).toEqual([{ from: 0, to: 2 }, { from: 3, to: 5 }])
  })
})

describe('markdownLinkAt', () => {
  const text = 'read [the docs](https://x.test) first'

  it('carries a link\'s target on the span', () => {
    expect(scanMarkdown(text).inline.map(span => span.url)).toEqual(['https://x.test'])
  })

  it('finds the link an offset sits in', () => {
    expect(markdownLinkAt(text, 8)?.url).toBe('https://x.test')
  })

  it('finds nothing outside one', () => {
    expect(markdownLinkAt(text, 2)).toBeUndefined()
    expect(markdownLinkAt(text, 34)).toBeUndefined()
  })
})

describe('activeMarkdownActions', () => {
  it('reports the caret\'s block', () => {
    expect(activeMarkdownActions('## title', 4, 4)).toEqual(['heading-2'])
  })

  it('reports nothing on a rule, which has no toolbar segment', () => {
    expect(activeMarkdownActions('---', 1, 1)).toEqual([])
  })

  it('reports nothing for a plain paragraph', () => {
    expect(activeMarkdownActions('plain', 2, 2)).toEqual([])
  })

  it('reports a block and the emphasis around the caret together', () => {
    expect(activeMarkdownActions('> a **b** c', 8, 8)).toEqual(['quote', 'bold'])
  })

  it('stacks emphasis that nests', () => {
    expect(activeMarkdownActions('**_both_**', 5, 5)).toEqual(['bold', 'italic'])
  })

  it('does not claim a format that only half-covers the selection', () => {
    expect(activeMarkdownActions('**bold** and more', 4, 14)).toEqual([])
  })

  it('never reports link, which is a popover rather than a toggle', () => {
    expect(activeMarkdownActions('[label](url)', 3, 3)).toEqual([])
  })

  it('reports the block at the end of the text', () => {
    expect(activeMarkdownActions('- item', 6, 6)).toEqual(['bulleted-list'])
  })
})

describe('applyMarkdownAction — emphasis', () => {
  it('wraps the selection and keeps it on the same words', () => {
    expect(applied('bold', 'a word b', 2, 6)).toBe('a **[word]** b')
  })

  it('unwraps when the selection is the wrapped text', () => {
    expect(applied('bold', 'a **word** b', 4, 8)).toBe('a [word] b')
  })

  it('unwraps when the selection includes the delimiters', () => {
    expect(applied('bold', 'a **word** b', 2, 10)).toBe('a [word] b')
  })

  it('opens an empty pair and leaves the caret inside it', () => {
    expect(applied('italic', 'a ', 2)).toBe('a _[]_')
  })

  it('uses the delimiters the toolbar announces', () => {
    expect(applied('strikethrough', 'x', 0, 1)).toBe('~~[x]~~')
    expect(applied('inline-code', 'x', 0, 1)).toBe('`[x]`')
    expect(applied('underline', 'x', 0, 1)).toBe('<u>[x]</u>')
  })
})

describe('applyMarkdownAction — lines', () => {
  it('prefixes the caret\'s line and carries the caret with it', () => {
    expect(applied('quote', 'line', 2)).toBe('> li[]ne')
  })

  it('takes the prefix back off when it is already there', () => {
    expect(applied('quote', '> line', 4)).toBe('li[]ne')
  })

  it('prefixes every line the selection touches', () => {
    const edit = applyMarkdownAction('bulleted-list', { text: 'one\ntwo', from: 1, to: 5 })
    expect(edit.text).toBe('- one\n- two')
  })

  it('brings the odd line into line rather than doubling the marker', () => {
    const edit = applyMarkdownAction('bulleted-list', { text: '- one\ntwo', from: 2, to: 7 })
    expect(edit.text).toBe('- one\n- two')
  })

  it('numbers a numbered list as it goes', () => {
    const edit = applyMarkdownAction('numbered-list', { text: 'a\nb\nc', from: 0, to: 5 })
    expect(edit.text).toBe('1. a\n2. b\n3. c')
  })

  it('replaces a heading level rather than stacking one', () => {
    expect(applied('heading-2', '# title', 3)).toBe('## t[]itle')
  })

  it('swaps one list kind for the other', () => {
    expect(applied('bulleted-list', '1. item', 4)).toBe('- i[]tem')
  })

  it('strips a heading level the toolbar cannot produce', () => {
    const edit = applyMarkdownAction('heading-1', { text: '##### deep', from: 0, to: 0 })
    expect(edit.text).toBe('# deep')
  })

  it('leaves a caret that was inside a removed marker at the content', () => {
    expect(applied('quote', '> line', 1)).toBe('[]line')
  })
})

describe('applyMarkdownAction — code blocks', () => {
  it('fences the selected lines', () => {
    const edit = applyMarkdownAction('code-block', { text: 'one\ntwo', from: 0, to: 7 })
    expect(edit.text).toBe('```\none\ntwo\n```')
    expect([edit.from, edit.to]).toEqual([4, 11])
  })

  it('opens an empty fence with the caret in it', () => {
    const edit = applyMarkdownAction('code-block', { text: '', from: 0, to: 0 })
    expect(edit.text).toBe('```\n\n```')
    expect(edit.from).toBe(4)
  })

  it('unfences from inside the code, where the caret actually is', () => {
    const edit = applyMarkdownAction('code-block', { text: '```\none\n```', from: 5, to: 5 })
    expect(edit.text).toBe('one')
    expect(edit.from).toBe(1)
  })

  it('leaves the text around a fenced block alone', () => {
    const edit = applyMarkdownAction('code-block', { text: 'before\n```\none\n```\nafter', from: 12, to: 12 })
    expect(edit.text).toBe('before\none\nafter')
  })
})

describe('insertMarkdownLink', () => {
  it('links the selected text and leaves the caret after it', () => {
    const edit = insertMarkdownLink('https://x.test', { text: 'see docs here', from: 4, to: 8 })
    expect(edit.text).toBe('see [docs](https://x.test) here')
    expect(edit.from).toBe(edit.to)
    expect(edit.text.slice(0, edit.from)).toBe('see [docs](https://x.test)')
  })

  it('falls back to the URL as its own label', () => {
    expect(insertMarkdownLink('https://x.test', { text: '', from: 0, to: 0 }).text)
      .toBe('[https://x.test](https://x.test)')
  })
})

describe('continueMarkdownLine', () => {
  it('carries a bullet onto the next line', () => {
    const edit = continueMarkdownLine({ text: '- one', from: 5, to: 5 })
    expect(edit?.text).toBe('- one\n- ')
    expect(edit?.from).toBe(8)
  })

  it('counts a numbered list on', () => {
    expect(continueMarkdownLine({ text: '1. one\n2. two', from: 13, to: 13 })?.text)
      .toBe('1. one\n2. two\n3. ')
  })

  it('keeps a nested item\'s indentation', () => {
    expect(continueMarkdownLine({ text: '  - one', from: 7, to: 7 })?.text).toBe('  - one\n  - ')
  })

  it('carries a quote on', () => {
    expect(continueMarkdownLine({ text: '> one', from: 5, to: 5 })?.text).toBe('> one\n> ')
  })

  it('ends the list when the item is empty', () => {
    const edit = continueMarkdownLine({ text: '- one\n- ', from: 8, to: 8 })
    expect(edit?.text).toBe('- one\n')
    expect(edit?.from).toBe(6)
  })

  it('leaves an ordinary line to the editor\'s own Enter', () => {
    expect(continueMarkdownLine({ text: 'plain', from: 5, to: 5 })).toBeUndefined()
  })

  it('does not split a marker in half', () => {
    expect(continueMarkdownLine({ text: '- one', from: 1, to: 1 })).toBeUndefined()
  })

  it('does nothing while a selection is open, so Enter replaces it', () => {
    expect(continueMarkdownLine({ text: '- one', from: 2, to: 5 })).toBeUndefined()
  })
})

describe('indentMarkdownLines', () => {
  it('nests an item by the width of its own marker', () => {
    expect(indentMarkdownLines('in', { text: '- one', from: 5, to: 5 })?.text).toBe('  - one')
    // A child of `1. ` has to reach the third column to be a child of it.
    expect(indentMarkdownLines('in', { text: '1. one', from: 6, to: 6 })?.text).toBe('   1. one')
  })

  it('lifts a nested item back out by the same step', () => {
    expect(indentMarkdownLines('out', { text: '  - one', from: 7, to: 7 })?.text).toBe('- one')
  })

  it('takes what indentation there is when it is less than a step', () => {
    expect(indentMarkdownLines('out', { text: ' - one', from: 6, to: 6 })?.text).toBe('- one')
  })

  it('carries the caret with the text it sits in', () => {
    const edit = indentMarkdownLines('in', { text: '- one', from: 4, to: 4 })
    expect(edit?.from).toBe(6)
    expect(edit?.to).toBe(6)
  })

  it('moves every item the selection touches, and nothing else', () => {
    const text = 'intro\n- one\n- two'
    expect(indentMarkdownLines('in', { text, from: 2, to: 15 })?.text).toBe('intro\n  - one\n  - two')
  })

  it('leaves Tab to the browser off a list', () => {
    expect(indentMarkdownLines('in', { text: 'a paragraph', from: 2, to: 2 })).toBeUndefined()
    expect(indentMarkdownLines('in', { text: '> quoted', from: 4, to: 4 })).toBeUndefined()
  })

  it('leaves Shift+Tab to the browser at the outer level, so focus can still go back', () => {
    expect(indentMarkdownLines('out', { text: '- one', from: 5, to: 5 })).toBeUndefined()
  })
})
