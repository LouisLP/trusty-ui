import { describe, expect, it } from 'vitest'
import { splitGuidance } from '../roster.mjs'
import {
  parseInvariants,
  resolveType,
  storyDescriptions,
  summarize,
} from './model.mjs'
import { renderComponent, renderIndex } from './render.mjs'

// The context pipeline CI's `context-generated` job gates on, tested without running it: the render half is pure over a model, and the reading half's pure parts can be called directly.

const COMPONENT = {
  name: 'TrustyThing',
  category: 'Form/Controls',
  depth: 'base',
  summary: 'A thing.',
  useWhen: ['you need a thing'],
  dontUseFor: ['two things — reach for TrustyThings'],
  description: 'A thing.',
  props: [
    { name: 'size', type: '"sm" | "md"', required: false, default: '"md"', description: 'How big.', options: null },
    { name: 'label', type: 'string', required: true, default: null, description: null, options: null },
  ],
  events: [{ name: 'change', type: '[value: string]', description: 'Fired on change.' }],
  slots: [{ name: 'default', type: null, description: 'The body.' }],
  stories: [{ name: 'Default', description: 'The default one.' }],
  storybook: 'https://sb.example/?path=/docs/form-controls-trustything--docs',
}

describe('parseInvariants', () => {
  it('keeps only the fenced ranges, titled by the heading above them', () => {
    const sections = parseInvariants([
      '# Title',
      '## Kept',
      'unfenced, dropped',
      '<!-- consumer:start -->',
      'shipped',
      '<!-- consumer:end -->',
      '## Dropped entirely',
      'nothing fenced here',
    ].join('\n'))

    expect(sections).toEqual([{ title: 'Kept', body: 'shipped' }])
  })

  it('merges two ranges under one heading, keeping them apart', () => {
    // What lets a section ship two paragraphs and withhold the one between.
    const sections = parseInvariants([
      '## One',
      '<!-- consumer:start -->',
      'first',
      '<!-- consumer:end -->',
      'withheld',
      '<!-- consumer:start -->',
      'second',
      '<!-- consumer:end -->',
    ].join('\n'))

    expect(sections).toHaveLength(1)
    expect(sections[0].body).toBe('first\n\nsecond')
  })

  it('refuses a fence that opens before any heading', () => {
    expect(() => parseInvariants('<!-- consumer:start -->\nx\n<!-- consumer:end -->'))
      .toThrow(/before the first/)
  })

  it('refuses a fence left open, or reopened inside itself', () => {
    expect(() => parseInvariants('## A\n<!-- consumer:start -->\nx'))
      .toThrow(/left open/)
    expect(() => parseInvariants('## A\n<!-- consumer:start -->\n<!-- consumer:start -->'))
      .toThrow(/reopened/)
  })

  it('refuses a CONTEXT.md with no fences at all, rather than shipping nothing', () => {
    expect(() => parseInvariants('## A\njust prose')).toThrow(/no consumer fences/)
  })
})

describe('storyDescriptions', () => {
  it('reads a JSDoc block back off the source, which the transform has eaten by then', () => {
    const source = [
      '/** The default one. */',
      'export const Default: Story = {}',
      '/**',
      ' * Two lines,',
      ' * joined.',
      ' */',
      'export const Other: Story = {}',
    ].join('\n')

    expect(storyDescriptions(source)).toEqual({
      Default: 'The default one.',
      Other: 'Two lines, joined.',
    })
  })

  it('does not swallow the lines between an earlier block and the story', () => {
    // The bug the regex is shaped around: a lazy [\s\S]*? starts at a helper's JSDoc and eats everything down to the next story.
    const source = [
      '/** A helper, not a story. */',
      'function helper() {}',
      '',
      'export const Default: Story = {}',
    ].join('\n')

    expect(storyDescriptions(source).Default).toBeUndefined()
  })
})

describe('splitGuidance', () => {
  it('splits the two bullet lists the guidance must carry', () => {
    const description = [
      'A thing.',
      '',
      '**Use it when**',
      '- you need a thing',
      '- you need one thing',
      '',
      '**Don\'t use it for**',
      '- two things — reach for TrustyThings',
    ].join('\n')

    expect(splitGuidance(description)).toEqual({
      useWhen: ['you need a thing', 'you need one thing'],
      dontUseFor: ['two things — reach for TrustyThings'],
    })
  })

  it('reports empty lists rather than throwing when the prose has neither', () => {
    expect(splitGuidance('Just a sentence.')).toEqual({ useWhen: [], dontUseFor: [] })
  })
})

describe('summarize', () => {
  it('stops at the guidance, which is not summary material', () => {
    expect(summarize('A thing.\n\n**Use it when**\n- always')).toBe('A thing.')
  })

  it('keeps taking sentences until the row is worth reading', () => {
    // "The button." on its own is too thin to choose on, and costs a file open to act on — so a short opening sentence pulls the next one in with it.
    const summary = summarize('The button. It submits, or it just acts, depending on type.')
    expect(summary).toBe('The button. It submits, or it just acts, depending on type.')
  })

  it('stops after one sentence that is already substantial enough', () => {
    const opening = 'A single opening sentence that comfortably carries the whole idea on its own.'
    expect(summarize(`${opening} And a second one nobody needs.`)).toBe(opening)
  })

  it('stops once the row is long enough, rather than running on', () => {
    const long = `${'A fairly wordy opening sentence about the component. '.repeat(6)}`
    expect(summarize(long).length).toBeLessThanOrEqual(161)
  })

  it('clips on a word boundary when a single sentence overruns', () => {
    const summary = summarize(`${'word '.repeat(80)}.`)
    expect(summary.endsWith('…')).toBe(true)
    expect(summary).not.toMatch(/\s…$/)
  })
})

describe('resolveType', () => {
  it('expands a small literal union, because the members are the documentation', () => {
    expect(resolveType({
      type: 'TrustyBadgeVariant | undefined',
      schema: { kind: 'enum', schema: ['"neutral"', '"info"', 'undefined'] },
    })).toBe('"neutral" | "info"')
  })

  it('collapses the two boolean literals back to boolean', () => {
    expect(resolveType({
      type: 'boolean | undefined',
      schema: { kind: 'enum', schema: ['true', 'false'] },
    })).toBe('boolean')
  })

  it('keeps the alias when its members would bury the answer', () => {
    // TrustyIconName: hundreds of literals that say nothing a reader wants.
    expect(resolveType({
      type: 'TrustyIconName | undefined',
      schema: { kind: 'enum', schema: Array.from({ length: 40 }, (_, i) => `"icon-${i}"`) },
    })).toBe('TrustyIconName')
  })

  it('drops the undefined arm, which `required` already reports', () => {
    expect(resolveType({ type: 'string | undefined' })).toBe('string')
  })
})

describe('renderComponent', () => {
  it('renders the props, events, slots and stories a reader needs', () => {
    const md = renderComponent(COMPONENT)

    expect(md).toContain('# TrustyThing')
    expect(md).toContain('`Form/Controls` · composition depth: `base`')
    expect(md).toContain('import { TrustyThing } from \'@louislp/trusty-ui\'')
    expect(md).toContain('| `size` | `"sm" | "md"` | `"md"` | How big. |'.replace(/\|(?= ")/g, '\\|'))
    expect(md).toContain('*required*')
    expect(md).toContain('- `change` — `[value: string]` — Fired on change.')
    expect(md).toContain('- `default` — The body.')
    expect(md).toContain('- Default — The default one.')
    expect(md).toContain('[Open TrustyThing in Storybook]')
  })

  it('escapes the pipes in a union type, which would otherwise break the table', () => {
    const md = renderComponent(COMPONENT)
    const row = md.split('\n').find(line => line.startsWith('| `size`'))
    // One cell per column: escaping is what keeps the union in a single cell.
    expect(row.split(/(?<!\\)\|/)).toHaveLength(6)
  })

  it('omits sections a component has nothing for', () => {
    const md = renderComponent({ ...COMPONENT, events: [], slots: [], stories: [], storybook: null })
    expect(md).not.toContain('## Events')
    expect(md).not.toContain('## Slots')
    expect(md).not.toContain('## Examples in Storybook')
    expect(md).toContain('[All components](../using-trusty-ui.md)')
  })

  it('carries the auto-generated banner, so nobody edits the output', () => {
    expect(renderComponent(COMPONENT)).toContain('AUTO-GENERATED')
  })
})

describe('renderIndex', () => {
  const model = {
    storybook: 'https://sb.example',
    invariants: [{ title: 'Token tiers', body: 'Two tiers.' }],
    components: [COMPONENT],
  }

  it('ships the invariants verbatim, under their own heading', () => {
    const md = renderIndex(model)
    expect(md).toContain('### Token tiers')
    expect(md).toContain('Two tiers.')
  })

  it('gives every component one row, linked to its own file', () => {
    const md = renderIndex(model)
    expect(md).toContain('| [TrustyThing](components/TrustyThing.md) | Form/Controls | base | A thing. |')
    expect(md).toContain('1 components.')
  })

  it('links the hosted Storybook when there is one, and says how to run it when not', () => {
    expect(renderIndex(model)).toContain('[Storybook](https://sb.example)')
    expect(renderIndex({ ...model, storybook: null })).toContain('`pnpm storybook` in the trusty-ui repository')
  })

  it('emits no timestamp or version, which would fail the CI gate every release', () => {
    expect(renderIndex(model)).toBe(renderIndex(model))
  })
})
