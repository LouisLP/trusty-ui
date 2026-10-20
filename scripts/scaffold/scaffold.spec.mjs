import { describe, expect, it } from 'vitest'
import { splitGuidance } from '../roster.mjs'
import { invalidReason, kebab, renderScaffold } from './render.mjs'

describe('renderScaffold', () => {
  const index = `// base — header comment.\nexport { default as TrustyAlert } from './TrustyAlert/TrustyAlert.vue'\n`
  const files = renderScaffold({ name: 'TrustyThing', depth: 'base', index })

  it('ships a public component\'s four things and a changeset, in its depth\'s folder', () => {
    expect(Object.keys(files).sort()).toEqual([
      '.changeset/trusty-thing.md',
      'src/components/base/TrustyThing/TrustyThing.spec.ts',
      'src/components/base/TrustyThing/TrustyThing.stories.ts',
      'src/components/base/TrustyThing/TrustyThing.vue',
      'src/components/base/index.ts',
    ])
  })

  it('appends the export line and keeps the index as it was', () => {
    expect(files['src/components/base/index.ts']).toBe(`${index}export { default as TrustyThing } from './TrustyThing/TrustyThing.vue'\n`)
  })

  it('writes guidance the gate can parse, left as TODO for the gate to refuse', () => {
    const stories = files['src/components/base/TrustyThing/TrustyThing.stories.ts']
    const { useWhen, dontUseFor } = splitGuidance(stories)
    expect(useWhen).toHaveLength(1)
    expect(dontUseFor).toHaveLength(1)
    expect(stories).toMatch(/\bTODO\b/)
    expect(stories).toContain('tags: [\'autodocs\']')
  })

  it('maps depth to its plural folder', () => {
    expect(Object.keys(renderScaffold({ name: 'TrustyThing', depth: 'composite' }))).toContain('src/components/composites/TrustyThing/TrustyThing.vue')
  })

  it('gives a private component only its .vue and spec', () => {
    expect(Object.keys(renderScaffold({ name: 'ThingBase', depth: 'private' })).sort()).toEqual([
      'src/components/private/ThingBase/ThingBase.spec.ts',
      'src/components/private/ThingBase/ThingBase.vue',
    ])
  })
})

describe('invalidReason', () => {
  it.each([
    ['TrustyThing', 'base', null],
    ['ThingBase', 'private', null],
    ['Thing', 'base', /Trusty/],
    ['TrustyThing', 'private', /prefix/],
    ['trustyThing', 'base', /PascalCase/],
    ['TrustyThing', 'widget', /unknown depth/],
  ])('%s at %s', (name, depth, expected) => {
    const reason = invalidReason(name, depth)
    if (expected === null)
      expect(reason).toBeNull()
    else
      expect(reason).toMatch(expected)
  })
})

it('kebab-cases a component name for its class and changeset', () => {
  expect(kebab('TrustyNavigationTabs')).toBe('trusty-navigation-tabs')
})
