// The one place a generator's output reaches disk. A generator renders `{ relativePath: contents }` and hands it here; this either writes it or, with `--check`, reports what the committed copy gets wrong without touching it.
//
// `owns` lists the directories a generator is the sole author of: a file there that the map no longer names is stale (a renamed or deleted component), so it is removed on write and reported on check.
import { existsSync, globSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'

/** Every path whose committed copy disagrees with `files`, with why. Reads, never writes. */
export function diffGenerated({ root, files, owns = [] }) {
  const stale = []
  for (const [path, contents] of Object.entries(files)) {
    const abs = join(root, path)
    if (!existsSync(abs))
      stale.push({ path, status: 'missing' })
    else if (readFileSync(abs, 'utf8') !== contents)
      stale.push({ path, status: 'changed' })
  }
  for (const dir of owns) {
    for (const path of globSync(`${dir}/**/*`, { cwd: root }).sort()) {
      if (!(path in files) && statSync(join(root, path)).isFile())
        stale.push({ path, status: 'extra' })
    }
  }
  return stale
}

/** Brings disk in line with `files`, returning what it changed. */
export function writeGenerated({ root, files, owns = [] }) {
  const stale = diffGenerated({ root, files, owns })
  for (const { path, status } of stale) {
    const abs = join(root, path)
    if (status === 'extra') {
      rmSync(abs)
      continue
    }
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, files[path])
  }
  return stale
}

/** The CLI half: `--check` in `argv` reports and fails, otherwise writes. Sets the exit code rather than exiting, so a caller's `finally` still runs. */
export function runGenerator({ name, root, files, owns = [], argv = process.argv }) {
  const check = argv.includes('--check')
  const stale = check ? diffGenerated({ root, files, owns }) : writeGenerated({ root, files, owns })
  const count = Object.keys(files).length

  if (!check) {
    console.log(`${name}: ${count} files, ${stale.length} updated`)
    return stale
  }
  if (!stale.length) {
    console.log(`${name}: ${count} files up to date`)
    return stale
  }
  console.error(`${name}: committed output is stale — run \`pnpm ${name}\` and commit the result.`)
  for (const { path, status } of stale)
    console.error(`  ${status.padEnd(7)} ${path}`)
  process.exitCode = 1
  return stale
}
