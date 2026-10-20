# Trusty UI

A modern, accessible Vue 3 component library and the design system it carries.
Built on [Reka UI](https://reka-ui.com/) headless primitives with
styling driven entirely by **vanilla CSS + the shared design tokens** (no SCSS,
no mixins).

One package, `@louislp/trusty-ui`: the components, the design tokens, the fonts, and
the [icons](src/icons) the components draw all ship together — a single entry to
import from.

> **Status: growing.** Built on battle-tested headless primitives so every
> component is accessible, keyboard-navigable, and themable by default.
> The surface grows component by component, so check Storybook before assuming
> something exists.

This README is the **hub**: how to set Trusty UI up, how the pieces fit together,
and how to build new components. Two things it deliberately does not carry —
**per-component prop tables**, which live in **Storybook** generated from the
source so they never drift, and the **vocabulary and invariants**, which live in
[CONTEXT.md](CONTEXT.md).

---

## Installing

Trusty UI is published to **GitHub Packages**, privately. A private GitHub
package needs credentials on reads as well as writes, so a consuming repo sets
up two things before the install: where `@louislp/*` lives, and who is asking.

### 1. Point the scope at GitHub Packages

Add a `.npmrc` at the **root of the consuming repo** — the directory you run
installs from. In a monorepo that is the repo root, not the frontend folder:
one file covers every workspace.

```ini
; .npmrc — safe to commit, contains no secret
@louislp:registry=https://npm.pkg.github.com
```

### 2. Provide a token

The token does **not** go in that file. pnpm reads auth only from the
user-level `~/.npmrc`, never from a committed project one — a hostile registry
line there could otherwise send the secret to a host of its choosing. Create a
[personal access token (classic)](https://github.com/settings/tokens/new?scopes=read:packages)
with the `read:packages` scope, from an account that can see this repository,
and add it once:

```sh
echo '//npm.pkg.github.com/:_authToken=<token>' >> ~/.npmrc
```

In a consuming repo's GitHub Actions, the workflow's own `GITHUB_TOKEN` can
read the package once that repo is granted access under the package's
**Package settings → Manage Actions access**. Give the job
`permissions: packages: read` and write the same line before installing:

```yaml
- run: echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> ~/.npmrc
```

> **Never commit a literal token.** Reading needs only `read:packages`;
> publishing is this repo's CI alone.

### 3. Install

```sh
pnpm add @louislp/trusty-ui @iconify/vue
```

`@iconify/vue` is a peer dependency, so your app and the library share one icon
store: an `addCollection` or `addAPIProvider` call of yours reaches every
`<TrustyIcon>`. The icons the components use are bundled inside the package and
render offline.

In a monorepo, add it to the workspace that actually uses it
(`pnpm --filter frontend add @louislp/trusty-ui`). The `.npmrc` is repo-wide
config; the dependency is not.

### What the consumer needs

| Requirement | Why |
| --- | --- |
| `vue` `^3.5` | Peer dependency — the app provides it |
| A bundler (Vite, webpack, …) | The build is ESM-only and imports CSS |
| `"moduleResolution": "bundler"` or `"node16"` | Types are exposed through `exports`, so classic `node` resolution won't find them |

---

## Setup

Load the global styles (reset, design tokens, base element styles, fonts)
**once** at your app entry, then import components anywhere:

```ts
// main.ts — run once at the app/extension root
import '@louislp/trusty-ui/src/styles/main.css'
```

That one import is the whole styling setup. The components' own CSS ships
inside the package entry — importing a component pulls its styles in with it —
so there is nothing else to wire up:

```vue
<script setup lang="ts">
import { TrustyButton } from '@louislp/trusty-ui'
</script>

<template>
  <TrustyButton variant="primary" label="Save changes" leading-icon="ph:floppy-disk" @click="save" />
</template>
```

Everything is exported from the package root (`@louislp/trusty-ui`) — components plus
the `TrustyIconName` type. Never
deep-import a component's `src/` path — the single `src/index.ts` entry is the
only public surface. The `src/styles/*` and `src/assets/fonts/*` subpaths are the
sole exception, because CSS can't come through the JS entry.

### The two stylesheets

There are exactly two, and they own different things:

| Stylesheet | Contains | How it loads |
| --- | --- | --- |
| `@louislp/trusty-ui/src/styles/main.css` | reset, design tokens, base element styles, the Fontsource `@font-face` imports | **You import it**, once, at the app root |
| `@louislp/trusty-ui/style.css` | the components' own rules (scoped SFC styles, bundled) | **Automatic** — the built entry imports it |

The global sheet stays manual because it restyles *your* document (`:root`
tokens, element defaults, fonts), so the app decides when that happens. The
component sheet is inseparable from the components, so the build keeps the
`import './style.css'` in `dist/index.mjs` (`css: { inject: true }` in
[tsdown.config.ts](tsdown.config.ts)) and your bundler picks it up.

Importing `@louislp/trusty-ui/style.css` by hand is harmless — the subpath export
exists for bundlers configured to drop CSS side effects from dependencies — but
in a normal Vite/webpack setup it is redundant.

Skipping `main.css` is what breaks: components would render with their layout
and structure intact but every `var(--…)` unresolved.

## Browsing components

The component catalogue — every prop, slot, variant, and a live playground —
lives in Storybook, not here:

```sh
pnpm storybook
```

Each component ships a `*.stories.ts` with `autodocs`, so the prop tables and
controls are generated straight from the source. When you want to know what a
component does or which props it takes, **read its story / open Storybook** —
that's the source of truth.

### From a repository that only installs the package

A consuming repository has none of the above — no stories, no Storybook, no
`CONTEXT.md`. So the package carries its own copy:

| In `node_modules/@louislp/trusty-ui/` | Holds |
| --- | --- |
| `context/using-trusty-ui.md` | the entry point: how to import, the invariants a consuming app must hold, and one row per component |
| `context/components/TrustyThing.md` | one component in full — its *use it when* / *don't use it for*, props, events, slots, and examples |
| `context/manifest.json` | all of it structured, for tooling — also importable as `@louislp/trusty-ui/manifest.json` |
| `README.md`, `CONTEXT.md`, `CHANGELOG.md` | this file, the invariants in full, and the version history |

The split is deliberate. One file per component keeps a lookup to the index plus
the one component in hand (~3k tokens); inlining all 42 made it ~21k to answer a
question about a single prop, and it would only grow.

Both files are generated by `pnpm generate:context` from the stories and from
the ranges of `CONTEXT.md` fenced `<!-- consumer:start -->`, and committed under
`context/`. Nothing in them is authored twice, which is the point: the guidance
a consumer reads is the same string Storybook renders.

Point an agent working in a consuming repository at the digest — one line in
that repository's `CLAUDE.md` is enough:

```md
Before using a Trusty UI component, read
`node_modules/@louislp/trusty-ui/context/using-trusty-ui.md`.
```

---

## The form system — three layers

Form-related components are split into three layers, each owning one concern.
You compose them top-down; each layer is usable on its own. Understanding this
split is the one conceptual thing worth reading before you build forms.

| Layer | Component(s) | Owns |
| ----- | ------------ | ---- |
| **1 — Controls** | `TrustyTextInput`, `TrustySecretInput`, `TrustyNumberField`, `TrustySelect`, `TrustyCombobox`, `TrustyRadioGroup`, `TrustyCheckbox`, `TrustySwitch`, … | The bare widget only — no label, no error text |
| **2 — Field** | `TrustyFormItem` | Label, hint, error, required marker, and all the ARIA wiring around one control |
| **3 — Form** | `TrustyForm` | The `<form>` element, field spacing, error summary, actions, `submit` |

### Layer 1 — Controls

A control is **just the input widget**. It renders no label and no error
message. Two props let the layer above drive its appearance and semantics:

- `invalid` — styles the control as errored and sets `aria-invalid`.
- `required` — sets the native `required` attribute.

Everything else (`id`, `aria-describedby`, `aria-labelledby`, `v-model`, …)
falls through to the focusable element. Because a control carries no chrome, it
works standalone when you don't need a label — but inside a form you let
`TrustyFormItem` feed it those attributes.

### Layer 2 — `TrustyFormItem` (the field)

`TrustyFormItem` wraps **one** control. It renders the label, optional hint,
error message, and the required marker; generates a stable id and links
label ↔ control ↔ hint ↔ error for screen readers. It hands the control
everything it needs through a `field` object exposed on its default scoped slot
— you spread it onto the Layer-1 control:

```vue
<TrustyFormItem label="Email" :error="emailError" required>
  <template #default="{ field }">
    <TrustyTextInput v-model="email" type="email" v-bind="field" />
  </template>
</TrustyFormItem>
```

Set `group` for radio/checkbox groups (the label becomes a `<span>` referenced
via `aria-labelledby` instead of a `<label for>`). Set `control-id` to pin the
control's id so the form summary below can link to it.

### Layer 3 — `TrustyForm` (the form)

`TrustyForm` is the `<form novalidate>` itself. It lays out fields with
consistent spacing, renders an optional **error-summary box** from its `errors`
prop (each entry can link to its field via `targetId`), exposes an `#actions`
slot for the buttons, and emits `submit`. **Validation stays with you** — you
own the v-models and decide what counts as an error; the form is
validation-library-agnostic.

```vue
<TrustyForm :errors="summary" @submit="save">
  <TrustyFormItem label="Email" control-id="email-field" :error="emailError" required>
    <template #default="{ field }">
      <TrustyTextInput v-model="email" type="email" v-bind="field" />
    </template>
  </TrustyFormItem>
  <TrustyFormItem label="Password" control-id="password-field" :error="passwordError" required>
    <template #default="{ field }">
      <TrustySecretInput v-model="password" v-bind="field" />
    </template>
  </TrustyFormItem>
  <template #actions>
    <TrustyButton type="submit" label="Sign in" />
  </template>
</TrustyForm>
```

**Why three layers?** Controls stay reusable on their own, the
accessibility wiring is centralised in one place (`TrustyFormItem`), and
validation is left entirely to the consumer. See the `TrustyForm` story for the
full working example.

---

## Authoring a new component

Author new shared UI components **here**. The rules below keep
every component accessible and on the design system.

### Where the component goes

`src/components/` splits by **composition depth**, not UI purpose — the five
categories and what each one means are defined in
[CONTEXT.md](CONTEXT.md#composition-depth). The folders are internal
organization; the export surface is unaffected, since everything still comes
from `@louislp/trusty-ui`.

Walk the questions in order and stop at the first that fits:

1. Uses zero other public components? → `base/`
2. Uses exactly one, only to skin or constrain it? → `specialized/`
3. Is part of the label/error/submit form contract itself? → `form/` (rare — that's a new layer, not a new component)
4. Uses 2+ public components, no business/app/runtime logic? → `composites/`
5. Knows about app domain, runtime, or backend state? → it doesn't belong in `trusty-ui` — keep it in the consuming app/extension.

Behaviour shared by several public components goes in `private/` as a `*Base`,
which the public ones then wrap.

### The rules

- **Keep each component a small primitive.** The UI gets built by composing
  primitives, so when a feature needs more logic, add a *new* component that
  composes the existing ones rather than growing one to absorb it.
- **Render a fixed element.** Every component commits to the markup it emits: a
  native `<button>` for a natively-accessible control, or Reka UI's **dedicated**
  primitives (`SliderRoot`/`SliderTrack`/…, `DialogRoot`/`DialogTrigger`/…) so
  keyboard nav, focus management, and ARIA come for free. The polymorphic
  `Primitive`, an `as` / `asChild` prop, and hand-rolled `<component :is>`
  switching all hand that commitment to the caller and break semantics and a11y
  with it — leave all three out.
- **Give every interaction a keyboard path**, honour `prefers-reduced-motion`,
  and expose a visible `:focus-visible` ring.
- **Style through semantic `var(--token)` properties only** — see
  [Global styles & design tokens](#global-styles--design-tokens) — in plain
  modern CSS with logical properties (`padding-inline`, `border-start-*`).
- **Keep the API minimal.** Prop-driven content over arbitrary slots; add a
  constrained explicit prop when a real need appears.
- **Depend on nothing local.** `vue`, `reka-ui`, `@iconify/vue`, `shiki`,
  `@codemirror/*` (editing surfaces only — `TrustyCodeBlock`'s edit mode and
  `TrustyMarkdownEditor`; see
  [ADR 0001](docs/adr/0001-codemirror-for-code-editing.md)), and
  `chart.js` + `vue-chartjs` (the chart components; see
  [ADR 0003](docs/adr/0003-chartjs-for-plots.md)) are the whole
  dependency surface — never a consuming app. A
  dependency this heavy is loaded by dynamic import, so it ships as its own chunk
  and never reaches a bundle that doesn't use it.
- **Name sidecars after their component**: `TrustyThing.types.ts`,
  `TrustyThing.config.ts`, `TrustyThing.format.ts` — never a bare `types.ts`.
  Composables keep their `useThing.ts` name.
- **Ship the four files** ([AGENTS.md](AGENTS.md#every-component-ships-four-things)):
  `pnpm new:component` scaffolds them, and `component-inventory.spec.ts` fails
  while one is missing.

---

## Global styles & design tokens

`src/styles/` holds the global stylesheet, organized in cascade layers and
barreled through `main.css` (loaded once at the app root, see [Setup](#setup)):

| File | Layer | Contents |
| --- | --- | --- |
| `reset.css` | `reset` | Browser-default fixes ([Josh Comeau's reset](https://www.joshwcomeau.com/css/custom-css-reset/)) |
| `tokens/tokens.css` | `tokens` | Barrel for the two token tiers below |
| `tokens/primitives.css` | `tokens` | Raw palette (`--color-blue-500`) — referenced only by the semantic tier |
| `tokens/semantic.css` | `tokens` | The design-system API components use: role-based color aliases (`--color-text`, `--color-primary-highlight`) + every scale (`--space-*`, `--radius-*`, `--duration-*`) |
| `base.css` | `base` | Element defaults (body typography, links) built on the tokens |

`semantic.css` is the **canonical token reference** — one source of
truth for the design system. Components reference `var(--token)` directly, since
custom properties cascade globally from `:root`.

Layer order is `reset, tokens, base`, assigned by `main.css` via
`@import … layer(…)` — the individual files stay layer-agnostic plain CSS.
Layered styles always lose to unlayered ones, so scoped SFC styles and app CSS
override the reset/base without specificity games.

---

## Icons

Icons are [Iconify](https://icon-sets.iconify.design/) names, `collection:icon`;
the library's default is Phosphor regular (`ph:*`). The ones the components use
are found by `pnpm generate:icons`, which scans `src/` and inlines their data
into a committed `src/icons/icons.generated.ts`; any other name is fetched from
the Iconify API. Use a new icon in a component, regenerate, commit both. See
[`src/icons/README.md`](src/icons/README.md) for the details, and use
`<TrustyIcon name="ph:…" />` to render.

---

## Develop

Requires Node 22+ and pnpm (via `corepack enable` — the `packageManager` field
pins the version). This is a single-package repo: every script runs from the
root, and there is no workspace to filter.

```sh
pnpm install
pnpm storybook
```

Storybook at [localhost:6006](http://localhost:6006) is the component
catalogue: every prop, slot, variant, and a live playground. It is the source of
truth for component documentation — this README deliberately carries no prop
tables, so they can't drift.

| Command | What it does |
| --- | --- |
| `pnpm storybook` | Component catalogue + playground (dev server) |
| `pnpm build-storybook` | Static Storybook build (what CI deploys to Pages) |
| `pnpm test:unit` | Vitest, `*.spec.ts` in jsdom |
| `pnpm test:storybook` | Every story rendered in Chromium: mounts, `play`, axe |
| `pnpm test:all` | Both projects |
| `pnpm test:coverage` | Both projects, plus v8 coverage and a JUnit report |
| `pnpm test:install` | One-time: fetch the Chromium the story tests render in |
| `pnpm type-check` | `vue-tsc --build` |
| `pnpm lint` / `pnpm lint:fix` | ESLint (`@antfu/eslint-config`, Vue a11y rules on) |
| `pnpm build` | Library build (tsdown → ESM + `.d.mts` + `style.css`) |
| `pnpm generate:icons` | Bundle every icon `src/` names into `src/icons/icons.generated.ts` |
| `pnpm generate:context` | Rebuild `context/` — the guidance that ships to consuming repositories |
| `pnpm new:component TrustyThing --depth base` | Scaffold a component: `.vue`, spec, stories, export line, changeset — `TODO`s left for the judgement calls |
| `pnpm generate:<icons\|context> --check` | Fail on stale committed output without writing — what CI runs |
| `pnpm changeset` | Record a version bump for the next release |

### Testing

Two Vitest projects, defined in `vitest.config.ts` and run by the same
`vitest` command:

- **`unit`** — the `*.spec.ts` beside each component, mounted with
  `@vue/test-utils` in jsdom. Fast, and where logic and prop behaviour belong.
- **`storybook`** — `@storybook/addon-vitest` turns every `*.stories.ts` export
  into a test in a real Chromium via Playwright. Each story must mount without
  error; its `play` function, if it has one, runs; and axe-core is checked
  against the result. The Testing panel inside `pnpm storybook` drives this
  same project, so a failure is one click from the story that caused it.

The browser binary is not in `node_modules` — run `pnpm test:install` once
before `pnpm test:storybook`.

Unit specs need no cleanup of their own: `vitest.setup.ts` unmounts every
`mount()`ed wrapper and empties `document.body` after each test, so a portalled
overlay never leaks into the next one.

Coverage is a root-level concern spanning both projects, so a component
exercised only through its stories still counts as covered.

#### Interaction tests

A story documents a state; a `play` function documents the behaviour that gets
you there, and turns the story into a test of it. Reach for one when a
component *does* something — an overlay opens, a keypress moves focus, an event
fires with a value. Worked examples in the repo:

| Story | What it pins down |
| --- | --- |
| `TrustySwitch › TogglesOnClick` | click, label-click, and Space all flip it |
| `TrustyTabs › KeyboardNavigation` | arrow keys skip a disabled tab; roving tabindex |
| `TrustyDialog › OpensAndCloses` | the trigger opens it, Escape closes it |
| `TrustyDropdownMenu › SelectsAnItem` | `select` carries the row's value, menu closes |

Two things bite in this library specifically. Overlays portal to `document.body`,
so query `within(canvasElement.ownerDocument.body)` rather than the canvas. And
they animate in, so a freshly-mounted overlay sits at `opacity: 0` for a frame
or two — wrap the first `toBeVisible` in `waitFor`.

`play` functions do not run on autodocs pages, so the catalogue still shows each
story in its resting state.

#### Accessibility

`@storybook/addon-a11y` runs axe-core against every story, in the Storybook UI
and in the `storybook` project. `.storybook/preview.ts` sets it to `'error'`:
a violation fails that story's test, and so CI's `test` job. The gate runs
against the story as it is left once `play` finishes, so an interaction test
that opens an overlay should close it again — an open modal menu aria-hides the
page behind it, trigger included, which axe reads as focusable content inside
`aria-hidden`.

A disabled control is exempt from contrast in WCAG, but axe can only tell it is
disabled from `disabled` or `aria-disabled="true"`. A control built on a
non-native element (an editable, a tag input) sets `aria-disabled` on its root
when disabled, rather than its contrast being raised to pass.

The one global exclusion is Reka's toast viewport: its two tabbable,
`aria-hidden` focus sentinels are its focus management, not content.

A story that legitimately cannot pass opts out with
`parameters: { a11y: { test: 'off' } }` and a comment saying why. Never lower
the global default to silence one story.

The library builds with tsdown and exposes a single public entry
(`src/index.ts`) — no per-category subpath exports.
[`AGENTS.md`](AGENTS.md#how-the-tooling-fits-together) maps which root config
owns what, and why `vite.config.ts` is not the build.

### Releasing

Versioning is [Changesets](https://github.com/changesets/changesets)-driven.
Add a changeset alongside the change:

```sh
pnpm changeset
```

Don't hand-edit the `version` field or `CHANGELOG.md`; `changeset version` owns
both.

Publishing is CI's job, from `main` only. Every push to `main` runs the gates,
deploys Storybook to [GitHub Pages](https://louislp.github.io/trusty-ui), and
hands the release to [`changesets/action`](https://github.com/changesets/action):

1. While unreleased changesets sit on `main`, it opens (or refreshes) a
   **Version Packages** pull request that runs `changeset version`.
2. Merging that pull request leaves none, so the next run publishes the new
   version to GitHub Packages with the workflow's `GITHUB_TOKEN`, tags it, and
   cuts a GitHub release.

The Version Packages pull request is opened by `GITHUB_TOKEN`, and GitHub does
not start workflows for events that token causes, so its checks never run on
their own. Its diff is only `package.json`'s version, `CHANGELOG.md` and the
deleted changesets; the `main` run after the merge gates the publish anyway.
