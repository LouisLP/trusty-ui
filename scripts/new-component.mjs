// Scaffolds a new component: the .vue, its spec, and for a public one its stories, its export line and a changeset — every file the inventory spec and the guidance gate demand.
//
//   node scripts/new-component.mjs TrustyThing --depth base   (or: pnpm new:component TrustyThing --depth base)
//
// Depth decides the folder (CONTEXT.md "Composition depth"; README's ladder walks it as questions). What the scaffold cannot decide is left as TODO, and the guidance gate fails until each one is answered.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { writeGenerated } from './generated.mjs'
import { readRoster } from './roster.mjs'
import { DEPTHS, invalidReason, renderScaffold } from './scaffold/render.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const name = args.find(a => !a.startsWith('-'))
const depthAt = args.indexOf('--depth')
const depth = depthAt === -1 ? undefined : args[depthAt + 1]

function fail(message) {
  console.error(`new:component: ${message}\n\n  pnpm new:component TrustyThing --depth <${DEPTHS.join('|')}>`)
  process.exit(1)
}

if (!name || !depth)
  fail('a name and a --depth are both required')
const reason = invalidReason(name, depth)
if (reason)
  fail(reason)
const taken = readRoster(root).find(c => c.name === name)
if (taken)
  fail(`${name} already exists at ${taken.dir}`)

const probe = renderScaffold({ name, depth })
const indexPath = Object.keys(probe).find(p => p.endsWith('/index.ts'))
const index = indexPath && existsSync(join(root, indexPath)) ? readFileSync(join(root, indexPath), 'utf8') : ''
const files = renderScaffold({ name, depth, index })

writeGenerated({ root, files })
// Sorts the new export line into place, and settles anything else the lint config has opinions on.
execFileSync('pnpm', ['exec', 'eslint', '--fix', ...Object.keys(files).filter(p => /\.(?:ts|vue)$/.test(p))], { cwd: root, stdio: 'inherit' })

console.log(`\nnew:component: scaffolded ${name}\n${Object.keys(files).map(p => `  ${p}`).join('\n')}`)
console.log(`
Next:
  - answer every TODO — the guidance gate (component-guidance.spec.ts) fails until you do
  - pnpm test:unit, then pnpm generate:context and commit context/ with the rest`)
