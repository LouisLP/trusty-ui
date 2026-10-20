# trusty-ui — agent guide

One package, one entry: `@louislp/trusty-ui` — the Vue 3 component library (Reka UI
primitives + design tokens) with its Iconify icons bundled. No workspace, no
apps, no sibling packages; every command runs from the repo root.

- [CONTEXT.md](CONTEXT.md) — the vocabulary and the invariants: composition
  depth, the three form layers, token tiers, the single entry, the mirror pairs.
  **Read it before placing, moving, or naming a component**, before touching
  export or build config, and before writing anything that names a domain term.
- [README.md](README.md) — consumer setup, the form system worked through in
  code, and the rules for authoring a new component.
- [src/icons/README.md](src/icons/README.md) — adding an icon.
- [docs/ui-ux-principles.md](docs/ui-ux-principles.md) — how a screen *built
  with* the library should look and read: token discipline, voice, the type
  scale, spacing, actions, states. **Read it before styling a screen or
  reviewing one**; authoring the library itself is `CONTEXT.md`'s job instead.
- [context/](context/) — **generated, never edited.** The guidance and invariants
  packaged for repositories that consume `@louislp/trusty-ui` and have none of the
  above. Change a story, a fenced range in `CONTEXT.md`, or
  `docs/ui-ux-principles.md`, then re-run `pnpm generate:context`.

## Commands

```sh
pnpm storybook        # component catalogue + playground, localhost:6006
pnpm test:unit        # vitest run, *.spec.ts in jsdom (bare `pnpm test` watches both projects)
pnpm test:storybook   # every story rendered in Chromium: mounts, play(), axe (a violation fails)
pnpm test:all         # both projects
pnpm test:coverage    # both projects + v8 coverage and junit.xml
pnpm test:install     # one-time: fetch the Chromium the story tests render in
pnpm type-check       # vue-tsc --build
pnpm lint             # add :fix to autofix
pnpm build            # tsdown → dist/
pnpm generate:icons   # icons named in src/ → src/icons/icons.generated.ts
pnpm generate:context # stories + CONTEXT.md fences → context/ (ships to consumers)
                      # either generator with --check: fail on stale output, write nothing
pnpm new:component TrustyThing --depth base # scaffold a component's four files + changeset
pnpm audit:code       # fallow: dead code, duplication, complexity, CSS health
pnpm audit:code:changed # the same, scoped to what changed vs origin/main
```

`audit:code` is advisory — nothing in CI gates on it. `.fallowrc.json` is
tuned so its output is trustworthy: `.storybook/`, `scripts/` and the build
configs are declared entry points (otherwise their devDependencies read as
unused), the published `src/styles/**` and font CSS are entries too (fallow
cannot expand the `exports` wildcards), and the unit-size ceiling is lifted for
SFC `<template>` blocks and spec files, which are containers rather than units
of logic. Two of its CSS checks are known false positives here: it resolves
neither the `animation: <name>` shorthand (so every `@keyframes` reads as
unreferenced) nor `@import … layer(name)` (so `main.css`'s three layers read as
unpopulated).

CI is GitHub Actions, in [`.github/workflows/ci.yml`](.github/workflows/ci.yml),
on every pull request and every push to `main`. It gates on `lint`,
`type-check`, `generate:icons --check`, `generate:context --check`, `build`,
and the test run, axe included — all required checks in the `main` ruleset, so
a red pull request cannot merge. Run the first four and `test:unit` by hand before
handing work back rather than waiting for the pipeline to say so, and
`test:storybook` too when a component's markup or colours changed.

## Every component ships four things

Start one with `pnpm new:component TrustyThing --depth base` (or `specialized`,
`form`, `composite`, `private`): it writes all four plus a changeset, with
every judgement call left as a `TODO` the guidance gate refuses. A component is
not done until all four exist. `component-inventory.spec.ts`
fails when one is missing — it reads [the roster](CONTEXT.md#the-roster), so a
new folder is checked the moment it exists:

1. `TrustyThing.vue` in the right category folder — the folder is the component's
   own directory, named for it.
2. `TrustyThing.spec.ts` beside it. If the component *does* something — an
   overlay opens, a keypress moves focus, an event fires with a value — also
   give one story a `play` function, which turns it into a browser test of that
   behaviour. README's Testing section has the four worked examples and the two
   gotchas (overlays portal to `document.body`; they animate in, so `waitFor`
   the first `toBeVisible`).
3. `TrustyThing.stories.ts` with `autodocs` — this is the *only* prop
   documentation, deliberately, so it cannot drift. No prop tables in Markdown.
   Its `docs.description.component` must carry a `**Use it when**` and a
   `**Don't use it for**` list, each with at least one bullet naming the
   component to reach for instead; `component-guidance.spec.ts` fails without
   them. That prose is the only thing telling a consumer *which* component to
   pick, and `pnpm generate:context` ships it to them.
4. An `export` line in that category's `index.ts`, which `src/index.ts` barrels.

A `private` component owes the first two, and must stay out of every barrel.

Then re-run `pnpm generate:context` and commit `context/` with the rest.

## Storybook is the component reference

To learn what a component does or which props it takes, read its
`*.stories.ts` and its `.vue` source. The Markdown docs describe structure and
rules; they carry no per-component API, and inventing one from memory is how
wrong props get written.

## How the tooling fits together

| File | Owns |
| --- | --- |
| `tsconfig.json` | `include` is `src/` only — configs and `.storybook/` are not type-checked |
| `vite.config.ts` | the Vue SFC plugin, for Storybook and Vitest — **not** the library build |
| `sfc-options.ts` | the SFC compile options both `vite.config.ts` and `tsdown.config.ts` pass their Vue plugin |
| `tsdown.config.ts` | the library build (ESM + dts + `style.css` from `src/index.ts`) |
| `vitest.config.ts` | jsdom, coverage, Reka UI dep inlining; merges `vite.config.ts` for SFC support |
| `.github/workflows/ci.yml` + `.github/actions/` | the CI gates, the Pages deploy, and the release; the two composite actions are the shared install and the Playwright Chromium |
| `vitest.setup.ts` | jsdom stubs for browser APIs Reka UI touches; unmounts wrappers and empties `document.body` after every spec |
| `eslint.config.mts` + `eslint/` | `@antfu/eslint-config`, Vue a11y rules on |
| `pnpm-workspace.yaml` | pnpm's own settings (shell emulator, trust policy, build allow-list) — there is no workspace to list |

`vite.config.ts` exists because Storybook's `@storybook/vue3-vite` ships no SFC
compiler and loads the project's Vite config to get `@vitejs/plugin-vue`; Vitest
merges the same file. Shared Vite concerns go there, not in `.storybook/main.ts`.

## Releasing

[Changesets](https://github.com/changesets/changesets)-driven, published by CI's
`release` job from `main` only, to GitHub Packages with the workflow's
`GITHUB_TOKEN`. While changesets are pending it keeps a "Version Packages" pull
request open; merging that publishes. Storybook deploys to GitHub Pages from
`main` in the same run.

```sh
pnpm changeset        # describe the change; commit the generated file with the branch
```

`changeset version` owns the `version` field and `CHANGELOG.md` — leave both
alone.

## Agent skills

- **Issue tracker** — GitHub Issues on `LouisLP/trusty-ui`, through the `gh`
  CLI. Read before filing, fetching, labelling, or closing a ticket:
  [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
- **Triage labels** — the five canonical roles, used verbatim as GitHub labels:
  `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`,
  `wontfix`. [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).
- **Domain docs** — single-context: this repo's `CONTEXT.md` plus a lazily
  created `docs/adr/`. [`docs/agents/domain.md`](docs/agents/domain.md).
