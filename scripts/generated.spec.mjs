import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { diffGenerated, runGenerator, writeGenerated } from './generated.mjs'
import { findIconNames, renderIcons } from './icons/render.mjs'

let root

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'generated-'))
  mkdirSync(join(root, 'out/nested'), { recursive: true })
  writeFileSync(join(root, 'out/same.md'), 'same')
  writeFileSync(join(root, 'out/changed.md'), 'old')
  writeFileSync(join(root, 'out/nested/gone.md'), 'stale')
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  process.exitCode = undefined
})

const files = { 'out/same.md': 'same', 'out/changed.md': 'new', 'out/added.md': 'added' }

describe('diffGenerated', () => {
  it('names every path the committed copy gets wrong, and nothing else', () => {
    expect(diffGenerated({ root, files, owns: ['out'] })).toEqual([
      { path: 'out/changed.md', status: 'changed' },
      { path: 'out/added.md', status: 'missing' },
      { path: 'out/nested/gone.md', status: 'extra' },
    ])
  })

  it('leaves unlisted files alone outside the directories it owns', () => {
    expect(diffGenerated({ root, files })).not.toContainEqual(expect.objectContaining({ status: 'extra' }))
  })
})

describe('writeGenerated', () => {
  it('brings disk in line with the map, removing what an owned directory no longer names', () => {
    writeGenerated({ root, files, owns: ['out'] })
    expect(readFileSync(join(root, 'out/changed.md'), 'utf8')).toBe('new')
    expect(readFileSync(join(root, 'out/added.md'), 'utf8')).toBe('added')
    expect(existsSync(join(root, 'out/nested/gone.md'))).toBe(false)
    expect(diffGenerated({ root, files, owns: ['out'] })).toEqual([])
  })
})

describe('runGenerator', () => {
  it('fails a --check on stale output without writing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    runGenerator({ name: 'gen', root, files, owns: ['out'], argv: ['--check'] })
    expect(process.exitCode).toBe(1)
    expect(readFileSync(join(root, 'out/changed.md'), 'utf8')).toBe('old')
  })

  it('passes a --check once the output is current', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    writeGenerated({ root, files, owns: ['out'] })
    runGenerator({ name: 'gen', root, files, owns: ['out'], argv: ['--check'] })
    expect(process.exitCode).toBeUndefined()
  })
})

describe('findIconNames', () => {
  it('collects quoted collection:icon literals, deduplicated and sorted', () => {
    expect(findIconNames([
      `<TrustyIcon name="ph:x" />`,
      `const a = cond ? 'ph:caret-up' : 'ph:x'`,
    ])).toEqual(['ph:caret-up', 'ph:x'])
  })

  it('skips code spans and anything that is not a whole quoted name', () => {
    expect(findIconNames(['/** e.g. `ph:gear` */', `'ph:x y'`, `"Ph:X"`])).toEqual([])
  })
})

describe('renderIcons', () => {
  it('inlines each icon\'s data under its name, sorted', () => {
    const source = renderIcons({ 'ph:z': { body: '<path d="z"/>' }, 'ph:a': { body: '<path d="a"/>', width: 256 } })
    expect(source.indexOf('\'ph:a\'')).toBeLessThan(source.indexOf('\'ph:z\''))
    expect(source).toContain('\'ph:a\': {"body":"<path d=\\"a\\"/>","width":256},')
    expect(source).toContain('export const bundledIcons: Record<string, IconifyIcon> = {')
  })
})
