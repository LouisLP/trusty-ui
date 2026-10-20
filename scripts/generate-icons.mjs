// Generates src/icons/icons.generated.ts — the Iconify data for every `collection:icon` name the library's own components use — so those icons render offline, with no API fetch.
//
// node scripts/generate-icons.mjs [--check]   (or: pnpm generate:icons [--check])
//
// The names are scanned, not listed: every quoted `collection:icon` literal in a non-story, non-spec `src/**/*.{vue,ts}` file whose collection is an `@iconify-json/<collection>` devDependency is resolved from that package. The devDependencies are what make a prefix a collection — `update:open` and `font-weight:bold` match the same pattern and are skipped. Stories and specs are left out because they show consumer usage, which fetches online like any consumer's would.
//
// src/icons/icons.generated.ts is COMMITTED, not gitignored: nothing regenerates it automatically. Whenever a component starts or stops using an icon you must re-run this script and commit the result, or the new icon is fetched from the Iconify API at runtime instead of rendering offline. CI's `icons-generated` job runs it with `--check`, which fails if the two disagree.
import { globSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { getIconData } from '@iconify/utils'
import { runGenerator } from './generated.mjs'
import { findIconNames, renderIcons } from './icons/render.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const { devDependencies } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const collections = new Set(
  Object.keys(devDependencies).filter(dep => dep.startsWith('@iconify-json/')).map(dep => dep.slice('@iconify-json/'.length)),
)

const sources = globSync('src/**/*.{vue,ts}', {
  cwd: root,
  exclude: path => /\.(?:stories|spec)\.ts$|\.generated\.ts$/.test(path),
}).map(path => readFileSync(join(root, path), 'utf8'))

const icons = {}
const missing = []
for (const name of findIconNames(sources)) {
  const [prefix, icon] = name.split(':')
  if (!collections.has(prefix))
    continue
  const data = getIconData(require(`@iconify-json/${prefix}/icons.json`), icon)
  if (data)
    icons[name] = data
  else
    missing.push(`${name}: not in @iconify-json/${prefix}`)
}

if (missing.length) {
  console.error('generate:icons: cannot bundle every icon the components use —')
  for (const line of missing)
    console.error(`  ${line}`)
  process.exitCode = 1
}
else {
  runGenerator({ name: 'generate:icons', root, files: { 'src/icons/icons.generated.ts': renderIcons(icons) } })
}
