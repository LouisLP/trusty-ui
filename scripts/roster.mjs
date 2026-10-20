// The roster: every component the folders under src/components/ imply, with its composition depth, its visibility, and which of the files a component ships it actually has. One walk, read by everything that needs to know what components exist — the guidance gate, the inventory spec, the context generator, the scaffolder.
//
// Vue-free and import-free beyond node:fs, so a spec can call it and so can a plain `node` script.
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// src/components/<folder>/ names the composition depth, which CONTEXT.md's "Composition depth" table defines. The folder is plural; the term is not. `private` has no depth a consumer sees: its components never reach src/index.ts.
export const DEPTH_BY_FOLDER = {
  base: 'base',
  specialized: 'specialized',
  form: 'form',
  composites: 'composite',
  private: null,
}

export const COMPONENTS_DIR = 'src/components'

/** Every component folder, sorted by path. Throws on a category folder the depth table does not name, rather than skipping it. */
export function readRoster(root) {
  const entries = []
  for (const folder of subdirs(join(root, COMPONENTS_DIR))) {
    if (!(folder in DEPTH_BY_FOLDER))
      throw new Error(`${COMPONENTS_DIR}/${folder}/ is not a category in DEPTH_BY_FOLDER (scripts/roster.mjs) — add it there and to CONTEXT.md's depth table`)
    const depth = DEPTH_BY_FOLDER[folder]
    for (const name of subdirs(join(root, COMPONENTS_DIR, folder))) {
      const dir = `${COMPONENTS_DIR}/${folder}/${name}`
      const file = ext => existsSync(join(root, dir, `${name}${ext}`)) ? `${dir}/${name}${ext}` : null
      entries.push({
        name,
        folder,
        depth,
        public: depth !== null,
        dir,
        vue: file('.vue'),
        spec: file('.spec.ts'),
        stories: file('.stories.ts'),
      })
    }
  }
  return entries
}

/** Splits a component's guidance prose into its `**Use it when**` / `**Don't use it for**` bullet lists — the format the guidance gate enforces and the context generator ships. */
export function splitGuidance(description) {
  const section = (label) => {
    const re = new RegExp(`\\*\\*${label}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\s*\\*\\*|$)`)
    const body = re.exec(description)?.[1]
    if (!body)
      return []
    return body
      .split('\n')
      .map(l => /^\s*-\s+(\S.*)$/.exec(l)?.[1]?.trim())
      .filter(Boolean)
  }
  return { useWhen: section('Use it when'), dontUseFor: section('Don\'t use it for') }
}

function subdirs(abs) {
  return readdirSync(abs).filter(n => statSync(join(abs, n)).isDirectory()).sort()
}
