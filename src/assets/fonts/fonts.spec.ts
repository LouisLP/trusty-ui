import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

/** A guard on `fonts.css` and the tokens that name its families, not on any component. jsdom measures nothing, so what is testable is the wiring: each `@import` resolves to a Fontsource stylesheet that ships with the package, and each `--font-family-*` token leads with a family one of those stylesheets declares — a renamed package or a typo in a token would otherwise fall through to the system stack without a sound. */
const CSS = readFileSync('src/assets/fonts/fonts.css', 'utf8')
const TOKENS = readFileSync('src/styles/tokens/semantic.css', 'utf8')
const require = createRequire(import.meta.url)

const imports = [...CSS.matchAll(/@import\s+'([^']+)'/g)].map(match => match[1]!)

/** The family a Fontsource stylesheet declares in its `@font-face` blocks. */
function familiesOf(specifier: string): Set<string> {
  const css = readFileSync(require.resolve(specifier), 'utf8')
  return new Set([...css.matchAll(/font-family:\s*'([^']+)'/g)].map(match => match[1]!))
}

/** The first family in a token's stack. */
function leadingFamily(token: string): string | undefined {
  const value = new RegExp(`${token}:\\s*([^;]+);`).exec(TOKENS)?.[1]
  return /^'([^']+)'/.exec(value?.trim() ?? '')?.[1]
}

describe('font loading', () => {
  it('ships no font files of its own', () => {
    expect(CSS).not.toMatch(/@font-face\s*\{|url\(/)
  })

  it.each(imports)('resolves %s from a dependency', (specifier) => {
    expect(familiesOf(specifier).size).toBe(1)
  })

  it('loads italics for the body and code faces, which the markdown editor and code comments use', () => {
    expect(imports).toContain('@fontsource-variable/inter/wght-italic.css')
    expect(imports).toContain('@fontsource-variable/jetbrains-mono/wght-italic.css')
  })

  it.each([
    ['--font-family-display', 'Bricolage Grotesque Variable'],
    ['--font-family-sans', 'Inter Variable'],
    ['--font-family-mono', 'JetBrains Mono Variable'],
  ])('%s leads with %s, a family fonts.css loads', (token, family) => {
    expect(leadingFamily(token)).toBe(family)
    expect(imports.some(specifier => familiesOf(specifier).has(family))).toBe(true)
  })
})
