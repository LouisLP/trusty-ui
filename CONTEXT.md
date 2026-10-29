# Context: trusty-ui

The vocabulary and the invariants of `@louislp/trusty-ui` — one Vue 3 component
library, one published package, one public entry. Use these terms verbatim in
issue titles, test names, commit subjects, and proposals; the folder names, the
barrel comments, and the Storybook titles all already speak them.

Procedures live elsewhere: [README.md](README.md) for setup, authoring, and the
form system's worked examples; [AGENTS.md](AGENTS.md) for commands and pointers.
This file defines what the words mean and what must stay true.

**Some of it ships.** The invariants a *consumer* must hold are the same
invariants written here, so they are not restated anywhere — the ranges fenced
with `<!-- consumer:start -->` / `<!-- consumer:end -->` are lifted verbatim into
`context/using-trusty-ui.md` by `pnpm generate:context`, under the heading they
sit beneath. Fence what a consuming app must know; leave everything about
authoring *this* library unfenced.

## Composition depth

<!-- consumer:start -->
The axis `src/components/` splits on — **how many other public components a
component composes**, never UI purpose. Purpose grouping is Storybook's job
(`Form/Controls`, `Overlays`, `Actions`, …), so one folder holds components from
several Storybook sections and that is correct.

| Term | Composes | Exported | Examples |
| --- | --- | --- | --- |
| **base** | at most `TrustyIcon` | yes | `TrustyButton`, `TrustyTextInput`, `TrustyDialog`, `TrustyTree` |
| **specialized** | exactly one other component, with fixed non-configurable content | yes | `TrustyBarChart`, `TrustyLineChart`, `TrustyThumbnail` |
| **form** | the label/error/submit contract itself | yes | `TrustyForm`, `TrustyFormItem` |
| **composite** | two or more public components, no app or domain logic | yes | `TrustyCodeBlock`, `TrustyContextMenu`, `TrustyDropdownMenu` |
| **private** | shared internals a public component wraps | **no** | `AlertBase`, `CodeEditorBase`, `DialogBase`, `EditableBase`, `NumberFieldBase`, `TagBase`, `TextInputBase` |
<!-- consumer:end -->

A **private base** is the sibling of *specialized*: `ChartBase` holds the
behaviour, `TrustyBarChart` and `TrustyLineChart` skin it, and only the skins
reach `src/index.ts`. Wrapping a private base still counts as composing one
component, so the wrapper is *specialized*.

*Private* is a visibility, though, not a shape. The `*Base*` naming covers the
shared-internals case; a component that is private because **only one component
will ever use it** — `MarkdownToolbar`, which exists for the markdown editor and
nothing else — keeps its own name and still composes freely, because no consumer
can reach it to be surprised by what it composes.

Depth is a measurement, not a promise. When a *specialized* pattern repeats two
or three times, the standing move is to promote it into a *base* component with
a variant prop rather than add a fourth wrapper.

<!-- consumer:start -->
**Where a component may not go:** anything that knows about app domain,
runtime, or backend state belongs in the consuming app, not here. `trusty-ui`
imports no other local package.
<!-- consumer:end -->

## The roster

**The roster** is the list of components the folders under `src/components/`
imply — one entry per component folder, carrying its depth (from the folder),
its visibility (`private` or not), and which of the four files it ships.
`scripts/roster.mjs` walks the folders once and everything that asks "which
components exist?" reads it: the guidance gate, the inventory spec
(`component-inventory.spec.ts`), the context generator, and the scaffolder. A
category folder the depth table does not name is an error, never a skip.

## The three form layers

<!-- consumer:start -->
Form components stack in three layers, each owning exactly one concern, each
usable alone. The layer names are the vocabulary; see the README for the
composition examples.

| Layer | Term | Owns |
| --- | --- | --- |
| 1 | **control** | the bare widget — no label, no error text |
| 2 | **field** (`TrustyFormItem`) | label, hint, error, required marker, and every ARIA link between them |
| 3 | **form** (`TrustyForm`) | the `<form novalidate>`, field spacing, error summary, actions, `submit` |

A control carries no chrome: it takes `invalid` and `required`, and lets
everything else (`id`, `aria-describedby`, `v-model`, …) fall through to its
focusable element. A field feeds it those attributes through the `field` object
on its default scoped slot.

**Validation is the consumer's.** No layer validates anything — the app owns the
v-models and decides what counts as an error, which is what keeps the library
validation-library-agnostic.
<!-- consumer:end -->

**Declaring `invalid` is the claim.** Every public component that declares an
`invalid` prop is held to the control contract by
`TrustyFormItem.conformance.spec.ts`, which discovers them rather than listing
them; a new control fails until it gets a row there, or a written exemption (the
inline editors, which are not form fields).

## Token tiers

<!-- consumer:start -->
Two tiers in `src/styles/tokens/`, and components may only see one of them.

- **primitive** (`primitives.css`) — the raw palette, all oklch,
  `--color-kaki-500`. Never referenced outside the semantic tier.
- **semantic** (`semantic.css`) — the design system's public API:
  `--color-primary-highlight`, `--color-text`, `--space-*`, `--radius-*`,
  `--duration-*`. This file is the canonical token reference.
  Every colour role is a `light-dark()` pair; `:root` declares
  `color-scheme: light dark`, and an app pins a mode by overriding it.
  Decorative colour gets roles too: `--color-tag-*` for tag hues. Chart series
  are the exception, component-level `--trusty-chart-series-*` that ChartBase
  owns, since nothing outside a chart draws them.

Components style through semantic tokens only; `token-tiers.spec.ts` fails when
a component's source names a primitive. Cascade layers run
`reset, tokens, base`, assigned by `main.css`; layered styles lose to unlayered
ones, so scoped SFC styles and app CSS win without specificity games.
<!-- consumer:end -->

## Two stylesheets

<!-- consumer:start -->
| Sheet | Holds | Loading |
| --- | --- | --- |
| `@louislp/trusty-ui/src/styles/main.css` | reset, tokens, base element styles, the Fontsource `@font-face` imports | the app imports it once at its entry |
| `@louislp/trusty-ui/style.css` | the components' own bundled rules | automatic — the built entry imports it |

The global sheet restyles the consumer's own document, so the app decides when
that happens. Skipping it is the classic failure: components render with layout
and structure intact and every `var(--…)` unresolved.
<!-- consumer:end -->

## Icons

- **bundled icon** — an Iconify name a component quotes in its own source
  (stories and specs don't count). `pnpm generate:icons` scans `src/` for them,
  resolves each from its `@iconify-json/<collection>` devDependency, and
  inlines the data into the committed **`icons.generated.ts`**. Components
  write raw names inline (`name="ph:x"`) — no role map, no aliases — so the
  scan is the only list. The default collection is Phosphor regular (`ph:*`).
<!-- consumer:start -->
- **Iconify icon** — every icon is a `collection:icon` name; the library's own
  are Phosphor regular (`ph:*`), browsable at https://icon-sets.iconify.design/.
  `TrustyIconName` is `` `${string}:${string}` ``, so a bare name fails
  `type-check` instead of rendering nothing; it is not a union of real names,
  which `vue-tsc` cannot reduce at Iconify's size (`TS2590`). The icons the
  components use are bundled and render offline. Any other name is fetched from
  the Iconify API on first render. `@iconify/vue` is a peer dependency, so an
  app's own `addCollection` / `addAPIProvider` reaches every `<TrustyIcon>`.
<!-- consumer:end -->

`src/icons/` is deliberately Vue-free data. The renderer is
`src/components/base/TrustyIcon` and all Vue-facing logic stays there.

## Internal modules

`src/internal/` is where code that more than one component needs lives — but
that no consumer may reach. The rule that decides the top level: **everything
directly under `src/` is publicly reachable** — `components/`, `icons/`,
`styles/`, `assets/` — and anything shared but never exported goes one level
down, into `internal/`, however cross-cutting it is. A helper only one component
uses stays in that component's own folder; `internal/` is for what crosses a
category boundary.

Most of it is deliberately Vue-free — `icons/`, `code-highlight/`, `clipboard/`
and `chart/` are all plain data and functions, which is what lets them be tested
without a mount. That is a strong default, not the rule: `codemirror/` also holds a
composable, because the duplication it removes was *in* two SFCs and a Vue-free
module could not have reached it. A composable there still owes the same debt as
the rest — it may not be exported, and it must earn its place by being needed by
more than one component.

Its four modules keep their own `##` headings below, because
`pnpm generate:context` titles a consumer section after the nearest `##` and a
`###` here would ship them all as "Internal modules".

## Code highlighting

`src/internal/code-highlight/` is the same arrangement as `src/icons/`: Vue-free
Shiki logic — the memoised highlighter, the language→grammar map,
`highlightToHtml` and `tokenizeCode` — with every Vue-facing decision left to
the two components that render it. `TrustyCodeBlock` renders the HTML in read
mode; the private `CodeEditorBase` behind its edit mode turns the tokens into
CodeMirror decorations. Both reach it by **dynamic import** only, so Shiki stays
out of bundles that highlight nothing, and both share one highlighter instance
so a read/edit swap loads no grammar twice.

<!-- consumer:start -->
`TrustyCodeLanguage` is the union of languages the code components can label and
highlight. Widening it means adding a grammar loader, not just a string.
<!-- consumer:end -->

## Editing surfaces

`src/internal/codemirror/` holds the CodeMirror lifecycle that both editing
surfaces sit on — the private `CodeEditorBase` behind `TrustyCodeBlock`'s edit
mode, and `TrustyMarkdownEditor`. Two files, and the split between them is load-
bearing rather than tidy:

- **`editor-host.ts`** — Vue-free. `createEditorHost(options)` owns the
  `EditorView`, the `editable` and `contentAttributes` compartments, history,
  the default keymap, the placeholder, and the equality-guarded document setter
  that keeps a `v-model` from looping. A surface passes only its own
  `extensions`, which are installed **before** the shared defaults so a surface
  keymap gets first refusal.
- **`useEditorHost.ts`** — the Vue half: the content/root attribute split
  (`id` and `aria-*` are pushed onto CodeMirror's editable element, everything
  else stays on the root), the async mount, teardown, and the watchers that push
  prop changes back through the handle.

**There is deliberately no `index.ts` barrel here.** `editor-host.ts` imports
`@codemirror/*`; the composable is imported *statically* by both SFCs. A barrel
re-exporting both would drag CodeMirror into the main bundle and break the lazy
chunk [ADR 0001](docs/adr/0001-codemirror-for-code-editing.md) requires. The
composable must never import `@codemirror/*` as a value — the `await import()`
lives in the `create` callback each surface passes in.

The two surfaces answer the **Tab question** differently, on purpose: code is
indented, so `CodeEditorBase` claims Tab everywhere and gives Esc an escape
hatch; prose is not, so `TrustyMarkdownEditor` claims Tab only inside a list and
lets it move focus everywhere else.

## Clipboard

`src/internal/clipboard/` is the smaller of the two: one `copyText(text)` that
prefers `navigator.clipboard` and falls back to a throwaway selection plus
`document.execCommand('copy')`. It exists because
`navigator.clipboard` is **undefined outside a secure context** — a deployed
Storybook or an IDE webview on plain HTTP has no Clipboard API at all — so
calling `navigator.clipboard.writeText(…)` directly throws on the click instead
of degrading. Anything that copies goes through `copyText`; it resolves
`false` rather than rejecting, and callers show their "copied" feedback only on
`true`.

## Charts

`src/internal/chart/` holds everything a plot needs that is not a component, and
it is split three ways because each part answers a different question:

- **`chart-data.ts`** — the data vocabulary. `TrustyChartSeries` (the one public
  type here, re-exported by `specialized/index.ts`), and the `ChartLegendSection`
  / `ChartDataTable` / `ChartPlotConfig` shapes a wrapper produces and
  `ChartBase` consumes. It sits in `internal/` rather than beside `ChartBase`
  because it crosses a category boundary: the wrappers are *specialized*, the
  base is *private*, and both need it.
- **`chart-style.ts`** — the token reader and the Chart.js options every plot
  shares. A canvas cannot resolve `var(--token)`, so `readChartTheme(el, n)`
  reads computed values off a live element and hands Chart.js real ones.
- **`chart-plots.ts`** — the lazy half: the vue-chartjs components plus the
  Chart.js elements and scales their controllers need. `ChartBase` reaches it by
  **dynamic import only**, so Chart.js ships as its own chunk
  ([ADR 0003](docs/adr/0003-chartjs-for-plots.md)). Never import it from a
  statically loaded file, and — as with `codemirror/` — **there is deliberately
  no barrel here**, because one would drag Chart.js into the main bundle.

`chart-categorical.ts` is a fourth file rather than part of `chart-data.ts` on
purpose: it is the *categorical family's* legend and table, shared by
`TrustyBarChart` and `TrustyLineChart`. A future doughnut or gauge shares
`chart-data.ts` with them and nothing else.

## The single entry

<!-- consumer:start -->
`src/index.ts` is the entire public surface: the four category barrels plus
the `TrustyIconName` type. Category folders and
`src/internal/` are internal organization, so there are
deliberately no per-category subpath exports — every component is imported from `@louislp/trusty-ui`
itself. The `style.css`, `styles/*`, and `fonts/*` subpaths exist for one reason
only — CSS and font files cannot travel through a JS entry.
<!-- consumer:end -->

**`trusty-source`** is a private export condition mapping `.` to `./src/index.ts`,
so a repo that vendors this checkout (by switching the condition on
repo-wide) resolves the library from source instead of a built `dist/`. It
must never reach the registry: `src/index.ts` is not in `files`, so a published
package advertising `trusty-source` would resolve to a file the tarball does not
contain.

## Mirror pairs

Three pairs must agree, and nothing at edit time enforces any of them — each
one drifts silently and is caught late, by CI or at runtime. Editing one half is
the whole signal that you owe the other half an edit.

| Pair | Drifts into | Caught by |
| --- | --- | --- |
| icon names in `src/` ↔ committed `icons.generated.ts` | a component's icon fetched from the Iconify API instead of rendering offline | CI job `icons-generated` |
| `*.stories.ts` + fenced ranges here ↔ committed `context/` | a consumer reading guidance the library no longer gives | CI job `context-generated` |
| `exports` ↔ `publishConfig.exports` in `package.json` | a published package resolving to a file the tarball lacks | nothing — reasoning only |
| this file ↔ `src/components/` | an agent trusting a stale taxonomy | nothing — reasoning only |

`publishConfig.exports` restates the whole `exports` map **without**
`trusty-source`; pnpm swaps the two at pack time.

## Architecture decisions

`docs/adr/` records decisions once they get made and need to stick. When your
output contradicts one, say so explicitly rather than quietly overriding it.

- [ADR 0001](docs/adr/0001-codemirror-for-code-editing.md) — CodeMirror 6 carries
  `TrustyCodeBlock`'s edit mode, fed by the same Shiki highlighter its read mode
  renders.
  Records why the dependency surface grew and why heavy deps load dynamically,
  and (since 2026-08-28) why the lifecycle both editing surfaces share lives in
  `src/internal/codemirror/` with no barrel.
- [ADR 0002](docs/adr/0002-css-recipes-stay-duplicated.md) — the focus ring,
  the control shell and the listbox item stay spelled out in every component
  that wants them. Records what a recipe tier would cost, and that the token
  tiers above are the invariant it would change.
- [ADR 0003](docs/adr/0003-chartjs-for-plots.md) — Chart.js 4, through
  `vue-chartjs`, paints every plot, loaded by dynamic import so it stays out of
  bundles that never mount a chart. One private `ChartBase`, one public
  component per plot type.
