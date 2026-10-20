import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { readRoster } from '../../scripts/roster.mjs'
import * as library from '../index'

// The inventory gate: AGENTS.md's "every component ships four things", as a test. The roster is what the folders say exists; this checks each entry shipped what its visibility owes.
// Vitest's root; jsdom gives import.meta.url an http scheme, so it cannot locate the repo.
const root = process.cwd()
const roster = readRoster(root)
const exported = new Set(Object.keys(library))

describe('component inventory', () => {
  it('finds the components to check', () => {
    expect(roster.filter(c => c.public).length).toBeGreaterThan(0)
    expect(roster.filter(c => !c.public).length).toBeGreaterThan(0)
  })

  describe.each(roster)('$folder/$name', (entry) => {
    it('has a .vue named for its folder', () => {
      expect(entry.vue, `${join(entry.dir, entry.name)}.vue`).not.toBeNull()
    })

    it('has a spec beside it', () => {
      expect(entry.spec, `${join(entry.dir, entry.name)}.spec.ts`).not.toBeNull()
    })

    if (entry.public) {
      it('has stories, which are its only prop documentation', () => {
        expect(entry.stories, `${join(entry.dir, entry.name)}.stories.ts`).not.toBeNull()
      })

      it('is exported from @louislp/trusty-ui', () => {
        expect(exported.has(entry.name), `no export line for ${entry.name} in ${entry.folder}/index.ts`).toBe(true)
      })
    }
    else {
      it('stays off the public surface', () => {
        expect(exported.has(entry.name)).toBe(false)
      })
    }
  })
})
