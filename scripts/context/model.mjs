// The context MODEL: everything derived from the repository, and nothing about how it is rendered.
//
// `render.mjs` is pure over what this returns, and the pure parts of the reading — a JSDoc block, a guidance list, a prop's type — can be called directly, which is what makes the pipeline testable.
//
// Everything here reads the repository. Nothing here writes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { createChecker } from 'vue-component-meta'
import { readRoster, splitGuidance } from '../roster.mjs'

// A union is worth expanding to its members when the members ARE the documentation ('neutral' | 'info' | …). TrustyIconName is the counter-example: hundreds of literals that say nothing a reader wants. Past this many, the alias name is the more useful answer.
export const MAX_UNION_MEMBERS = 12

// Index rows are the one thing every reader pays for, so a row stays a row — but a row too thin to choose on costs a file open, which is worse.
const SUMMARY_MAX = 160
const SUMMARY_MIN = 60

/** Storybook's own id slug: lowercase, non-alphanumeric runs collapse to `-`. */
export function sanitize(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function docsUrl(storybookUrl, title) {
  return storybookUrl ? `${storybookUrl}/?path=/docs/${sanitize(title)}--docs` : null
}

// Walks CONTEXT.md once, tracking the current `##` heading, and keeps only the fenced ranges. Multiple ranges under one heading merge into one section, which is what lets a section ship two paragraphs and withhold the one in between.
export function parseInvariants(source) {
  const lines = source.split('\n')
  const sections = []
  let heading = null
  let keeping = false

  for (const line of lines) {
    const h2 = /^## (.+)$/.exec(line)
    if (h2) {
      heading = h2[1]
      continue
    }
    if (line.trim() === '<!-- consumer:start -->') {
      if (!heading)
        throw new Error('CONTEXT.md: a consumer fence opened before the first `##` heading')
      if (keeping)
        throw new Error(`CONTEXT.md: consumer fence reopened inside "${heading}"`)
      keeping = true
      let section = sections.find(s => s.title === heading)
      if (!section)
        sections.push(section = { title: heading, body: [] })
      // Two ranges under one heading are separate prose; keep them apart.
      else section.body.push('')
      continue
    }
    if (line.trim() === '<!-- consumer:end -->') {
      if (!keeping)
        throw new Error(`CONTEXT.md: consumer fence closed without opening in "${heading}"`)
      keeping = false
      continue
    }
    if (keeping)
      sections.at(-1).body.push(line)
  }

  if (keeping)
    throw new Error(`CONTEXT.md: consumer fence left open in "${heading}"`)
  if (!sections.length)
    throw new Error('CONTEXT.md: no consumer fences found — the digest would ship no invariants')

  return sections.map(s => ({ title: s.title, body: s.body.join('\n').trim() }))
}

// Story-level prose lives in a JSDoc block above the export, which Storybook reads with a compiler transform and which is therefore gone by the time the module is evaluated. The shape is narrow enough to read off the source.
export function storyDescriptions(source) {
  const found = {}
  // The block may not itself contain `*/` — with a plain `[\s\S]*?` the match happily starts at some earlier JSDoc (a helper's, say) and swallows every line between it and the story.
  const re = /\/\*\*((?:[^*]|\*(?!\/))*)\*\/\s*export const (\w+)\s*:/g
  for (const [, block, name] of source.matchAll(re)) {
    const text = block
      .split('\n')
      .map(l => l.replace(/^\s*\*\s?/, '').trim())
      .join(' ')
      .trim()
    if (text)
      found[name] = text
  }
  return found
}

/** One sentence, for the index — enough to tell this component from its neighbours, and no more. The index is read in full every time; the paragraph it comes from is a click away in the component's own file. */
export function summarize(description) {
  const opening = description.split(/\n\s*\*\*/)[0].trim().split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim()

  // A colon is never the end of the useful part — "A small status label: plain text with a colour role" is one thought. And a first sentence can be too thin to choose on ("The button."), so keep taking sentences until the row earns its place.
  let summary = ''
  for (const sentence of opening.split(/(?<=[.!?])\s+/)) {
    if (summary && (summary.length >= SUMMARY_MIN || `${summary} ${sentence}`.length > SUMMARY_MAX))
      break
    summary = summary ? `${summary} ${sentence}` : sentence
  }

  if (summary.length <= SUMMARY_MAX)
    return summary
  const clipped = summary.slice(0, SUMMARY_MAX)
  return `${clipped.slice(0, clipped.lastIndexOf(' '))}…`
}

async function readStories(root, storybookUrl) {
  // `private` holds the shared internals no consumer can import; a story there documents something that isn't on the public surface. A public component without stories is the inventory spec's to catch.
  const roster = readRoster(root).filter(c => c.public && c.stories)
  const server = await createServer({
    configFile: join(root, 'vite.config.ts'),
    root,
    server: { middlewareMode: true, watch: null },
    logLevel: 'error',
  })

  try {
    const components = []
    for (const { name, depth, stories: file } of roster) {
      const mod = await server.ssrLoadModule(`/${file}`)
      const meta = mod.default
      const description = (meta.parameters?.docs?.description?.component ?? '').trim()
      const title = meta.title ?? ''
      const prose = storyDescriptions(readFileSync(join(root, file), 'utf8'))

      components.push({
        name,
        // The Storybook section — how the catalogue groups by purpose, which is a different axis from `depth`. Both are worth having.
        category: title.split('/').slice(0, -1).join('/'),
        depth,
        description,
        summary: summarize(description),
        ...splitGuidance(description),
        argTypes: meta.argTypes ?? {},
        // Every named export of a CSF module is a story, in declaration order.
        stories: Object.keys(mod)
          .filter(k => k !== 'default')
          .map(k => ({ name: k, description: prose[k] ?? null })),
        title,
        file,
        storybook: docsUrl(storybookUrl, title),
      })
    }
    return components
  }
  finally {
    await server.close()
  }
}

function readApi(root, componentFiles) {
  const checker = createChecker(join(root, 'tsconfig.json'), {
    forceUseTs: true,
    // Off by default, and without it every union arrives as its alias name — `variant` would read `TrustyBadgeVariant` instead of its five values. resolveType() puts the cap back on, for the aliases (TrustyIconName) whose members are noise.
    schema: { ignore: [] },
    printer: { newLine: 1 },
  })

  const api = {}
  for (const [name, file] of Object.entries(componentFiles)) {
    const meta = checker.getComponentMeta(join(root, file))
    api[name] = {
      props: meta.props
        // `global` is every attribute Vue lets fall through — class, id, onClick, and several hundred more. None of it is this component's API.
        .filter(p => !p.global)
        .map(p => ({
          name: p.name,
          type: resolveType(p),
          required: p.required,
          default: p.default ?? null,
          description: (p.description ?? '').trim() || null,
        })),
      events: meta.events.map(e => ({
        name: e.name,
        type: (e.type ?? '').trim() || null,
        description: (e.description ?? '').trim() || null,
      })),
      slots: meta.slots.map(s => ({
        name: s.name,
        type: (s.type ?? '').trim() || null,
        description: (s.description ?? '').trim() || null,
      })),
    }
  }
  return api
}

// Prefers the expanded union when the members are the documentation, and the alias name when they'd bury it. `| undefined` is dropped either way — the `required` flag already says that.
export function resolveType(prop) {
  const declared = String(prop.type ?? '').replace(/\s*\|\s*undefined\s*$/, '').trim()
  const schema = prop.schema
  if (schema && typeof schema === 'object' && schema.kind === 'enum' && Array.isArray(schema.schema)) {
    const members = schema.schema.filter(m => m !== 'undefined')
    // TS models a boolean as the union of its two literals; nobody wants to read that.
    if (members.length === 2 && members.includes('true') && members.includes('false'))
      return 'boolean'
    const literal = members.every(m => typeof m === 'string' && /^(?:["'].*["']|true|false|-?\d+)$/.test(m))
    if (literal && members.length && members.length <= MAX_UNION_MEMBERS)
      return members.join(' | ')
  }
  return declared
}

/** The whole model, ready to render or serialise: the invariants that ship, and every public component with its guidance, props, events, slots and stories. */
export async function buildContextModel({ root, storybookUrl }) {
  const invariants = parseInvariants(readFileSync(join(root, 'CONTEXT.md'), 'utf8'))
  const fromStories = await readStories(root, storybookUrl)

  const componentFiles = Object.fromEntries(
    fromStories.map(c => [c.name, c.file.replace(/\.stories\.ts$/, '.vue')]),
  )
  const api = readApi(root, componentFiles)

  const components = fromStories
    .map(c => ({
      name: c.name,
      category: c.category,
      depth: c.depth,
      summary: c.summary,
      useWhen: c.useWhen,
      dontUseFor: c.dontUseFor,
      description: c.description,
      props: api[c.name].props.map((p) => {
        // The story's argTypes are the other half of a prop's documentation, and where they overlap with the type they're the better answer: the options are listed in the order the design intends, and a prop whose JSDoc is missing often still has a description on its control.
        const arg = c.argTypes[p.name] ?? {}
        const options = Array.isArray(arg.options) ? arg.options : null
        const usable = options
          && options.length > 0
          && options.length <= MAX_UNION_MEMBERS
          && options.every(o => ['string', 'number', 'boolean'].includes(typeof o))
        return {
          ...p,
          type: usable ? options.map(o => JSON.stringify(o)).join(' | ') : p.type,
          description: p.description ?? ((arg.description ?? '').trim() || null),
          options,
        }
      }),
      events: api[c.name].events,
      slots: api[c.name].slots,
      stories: c.stories,
      storybook: c.storybook,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  return { storybook: storybookUrl || null, invariants, components }
}
