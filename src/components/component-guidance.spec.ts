import type { Meta } from '@storybook/vue3-vite'
import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { readRoster, splitGuidance } from '../../scripts/roster.mjs'

// The guidance gate.
//
// A component's `docs.description.component` is the only place this library says which component to reach for and which not — Storybook renders it for humans, and `pnpm generate:context` lifts it into context/using-trusty-ui.md for consuming repositories. Types give a consumer the shape of a component, never the choice between two of them.
//
// So the two headings are structure, not prose style. A component that ships without them ships into consumers as a name and a prop table, which is exactly the "how do I know whether to use this?" gap the context bundle exists to close.
// Vitest's root; jsdom gives import.meta.url an http scheme, so it cannot locate the repo.
const root = process.cwd()

// `private` components are the shared internals a public component wraps; they never reach src/index.ts, so no consumer can choose one. A public component with no stories at all is the inventory spec's to catch.
const publicStories = await Promise.all(
  readRoster(root)
    .filter(c => c.public && c.stories)
    .map(async c => [c.stories!, await import(/* @vite-ignore */ join(root, c.stories!)) as { default: Meta }] as const),
)

describe('component guidance', () => {
  it('finds the stories to check', () => {
    expect(publicStories.length).toBeGreaterThan(0)
  })

  describe.each(publicStories)('%s', (_path, module) => {
    const meta = module.default
    const description = meta.parameters?.docs?.description?.component ?? ''

    it('describes what the component is', () => {
      expect(description.trim()).not.toBe('')
    })

    const { useWhen, dontUseFor } = splitGuidance(description)

    it('lists at least one "Use it when" bullet', () => {
      expect(useWhen).not.toHaveLength(0)
    })

    it('lists at least one "Don\'t use it for" bullet', () => {
      expect(dontUseFor).not.toHaveLength(0)
    })

    it('has no TODO left from the scaffold', () => {
      expect(`${meta.title} ${description}`).not.toMatch(/\bTODO\b/)
    })

    it('is grouped under a Storybook section', () => {
      // "Data Display/TrustyBadge" — the section becomes the digest's grouping.
      expect(meta.title ?? '').toMatch(/^.+\/[^/]+$/)
    })

    it('opts into autodocs', () => {
      expect(meta.tags ?? []).toContain('autodocs')
    })
  })
})
