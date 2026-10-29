import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// The token-tier gate.
//
// Components style through semantic.css only. The primitive tier — every custom property primitives.css declares — is semantic.css's to alias, so a component that names one bypasses the role a retune would move. Specs are exempt: they may quote a token as test data.
const PRIMITIVES = new Set(readFileSync('src/styles/tokens/primitives.css', 'utf8').match(/--[\w-]+(?=\s*:)/g))

const isPrimitive = (name: string) => PRIMITIVES.has(name)

const sources = ['src/components', 'src/internal'].flatMap(dir =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter(file => /\.(?:vue|ts|css)$/.test(file) && !file.endsWith('.spec.ts'))
    .map(file => join(dir, file)),
)

describe('token tiers', () => {
  it('reads the primitive tier', () => {
    expect(PRIMITIVES).toContain('--color-white')
    expect(sources.length).toBeGreaterThan(0)
  })

  it.each(sources)('%s names no primitive token', (file) => {
    const named = readFileSync(file, 'utf8').match(/--[\w-]+/g) ?? []
    expect(named.filter(isPrimitive)).toEqual([])
  })
})
