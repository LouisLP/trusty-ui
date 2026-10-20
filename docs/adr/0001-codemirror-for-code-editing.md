# ADR 0001 — CodeMirror 6 for code editing, with Shiki as its highlighter

**Status:** accepted, 2026-08-18 — extended 2026-08-26 to `TrustyMarkdownEditor`,
lifecycle shared 2026-08-28 (`src/internal/codemirror/`)
**Affects:** `TrustyCodeBlock`'s edit mode (`private/CodeEditorBase`), `TrustyMarkdownEditor`, the dependency surface in
[README.md](../../README.md#the-rules) and
[CONTEXT.md](../../CONTEXT.md#composition-depth)

## Context

`TrustyCodeBlock` has an editable mode, carried by the private `CodeEditorBase`,
and it has to colour code while the user types. A `<textarea>` cannot: it paints one uniform
colour, with no hook for a coloured span inside its value. Three approaches were
built or measured.

1. **A highlight overlay** — a Shiki-rendered `<pre>` under a transparent
   textarea. Built first, and rejected in review: the caret drifts from the
   glyphs whenever any font metric diverges between the two layers, and the
   per-keystroke re-render flickers between coloured and plain.
2. **A plain textarea, no colour** — shipped as an interim, and correct in every
   respect except the one that mattered: no colour while editing.
3. **CodeMirror 6** — a real editor: its own caret, selection, undo and IME
   handling, incremental viewport-scoped rendering, and a decoration model built
   for exactly this.

The obvious integration, `@shikijs/codemirror`, **does not exist** — Shiki's
only first-party editor package is `@shikijs/monaco`. So the choice within
CodeMirror was: colour via CodeMirror's own Lezer grammars (near-parity, since
Lezer and TextMate draw token boundaries differently), take the third-party
`codemirror-shiki@0.3.x`, or write the bridge.

## Decision

Use **CodeMirror 6 with official `@codemirror/*` packages only**, and feed it
tokens from the **existing Shiki highlighter** through a bridge we own
(`CodeEditorBase.shiki.ts`, ~140 lines).

Because Shiki tokenizes, CodeMirror needs no Lezer language package at all: no
`@codemirror/lang-*`, no `@lezer/*`. The dependency is
`@codemirror/{state,view,commands,language}` — 11 packages transitively.

This is the only option that makes the read and edit views colour a snippet
*identically* rather than similarly: one highlighter instance, one theme, one set
of grammars, shared by both halves via `src/internal/code-highlight`.

## Consequences

- **The dependency surface grows**, which the README previously enumerated as
  `vue`, `reka-ui`, `@iconify/vue`, `shiki`. Both docs are updated. CodeMirror is
  loaded by dynamic import, so it is a separate chunk that only reaches bundles
  which actually open an editor — the same treatment Shiki already gets.
  Measured: ~100 kB gzip for the editor chunk, against ~123 kB for the entire
  library today, which is why the lazy import is not optional — a consumer that
  never sets `editable` never reaches it.
- **The editable element is a `contenteditable`, not a `<textarea>`.** So
  `required` is advisory (`aria-required`), the value does not participate in
  native form submission, and `TrustyFormItem`'s `id`/`aria-describedby` must be
  pushed onto the editor's content element rather than falling through the
  template. `CodeEditorBase` does this via `EditorView.contentAttributes`.
- **Styling moves into CodeMirror's theme facet.** CodeMirror creates its own
  DOM, which never carries Vue's scope attribute, so scoped CSS cannot reach it.
  The theme still uses semantic tokens only, so the token rules hold.
- **We own the bridge.** Shiki tokenizes the whole document, CodeMirror
  decorations are viewport-scoped; the bridge debounces (80 ms) and maps existing
  decorations through each edit so colour travels with the text instead of
  flashing. If that ever needs to scale to large documents, per-viewport
  tokenizing is the next step.
- **Tests drive CodeMirror's API**, not synthetic DOM events: jsdom has no
  layout, and a contenteditable does not respond to synthetic input events.

## Shape

`CodeEditorBase` is **private**: it owns the editable surface and no chrome, so
`TrustyCodeBlock` owns the whole read↔edit lifecycle (the Edit/Save buttons, the
draft, the `submit` event) and there is exactly one public component for code.
The editor was briefly a public `TrustyCodeEditor`; that exposed two components a
consumer had to choose between, for one job.

## Since: the markdown editor

`TrustyMarkdownEditor` (2026-08-26) is the second editing surface, and it reaches
the same conclusion from a different direction. It has no Shiki to feed it, so
the question was whether colouring markdown needed `@codemirror/lang-markdown`
and `@lezer/markdown`. It does not: what it colours is *blocks* — a tinted quote
band, a fenced run, a dimmed `**` — which a line-oriented scanner of pure string
functions (`TrustyMarkdownEditor.markdown.ts`) reports without a grammar, and
which the same scanner then uses to answer the toolbar's pressed state and to
apply a format. So the dependency surface did not grow again: still
`@codemirror/{state,view,commands,language}`, still one lazy chunk.

The reason a textarea was ruled out is the one recorded above, unchanged — it
paints one uniform colour, and a tint behind a quote has nowhere to live in it.

## Since: one shared host

The markdown editor above arrived by copying `CodeEditorBase`, and what it
copied was not the interesting part. Both surfaces ended up implementing the
same CodeMirror lifecycle — compartments, `EditorView` construction, history,
the default keymap, the equality-guarded setter, teardown — and both SFCs ended
up implementing the same mount, the same attribute split and the same watchers,
comments included. Where the two diverged, they diverged silently: two different
answers to the Tab question, `focusOnAttach` on one side only.

That lifecycle now lives in `src/internal/codemirror/`, and a surface passes
only its own extensions. **This does not change the decision above** — still
CodeMirror 6, still `@codemirror/{state,view,commands,language}`, still Shiki
feeding the code side through a bridge we own, still one lazy chunk.

It does add one constraint that exists *only* to keep the lazy chunk lazy, and
that is easy to break by accident:

- `editor-host.ts` imports `@codemirror/*`, and is reached only through each
  surface's dynamically-imported `.editor.ts`.
- `useEditorHost.ts` is imported **statically** by both SFCs, so it must never
  import `@codemirror/*` as a value — the `await import()` lives in the `create`
  callback a surface passes in. `import type` is erased and is safe.
- **There is deliberately no `index.ts` barrel in that folder.** One would
  re-export both, and the composable's static import would pull CodeMirror into
  the main bundle — undoing the measurement this ADR rests on.

Measured after the change: the main entry did not grow (527.4 kB → 527.0 kB),
and `editor-host` became a third lazy chunk (1.6 kB) that the two editor chunks
share, so both shrank.

The Tab divergence stays, now as a decision rather than an accident: code is
indented, so `CodeEditorBase` claims Tab everywhere and gives Esc an escape
hatch; prose is not, so `TrustyMarkdownEditor` claims Tab only inside a list.

The host also got the first spec this lifecycle has ever had. Previously every
assertion about it went through a component mount, a dynamic import and
`EditorView.findFromDOM()` to pull the live view back out of the DOM — the note
above that "tests drive CodeMirror's API, not synthetic DOM events" is still
true, but they can now drive it directly.

## Alternatives, if this needs revisiting

`codemirror-shiki` would replace the bridge with a dependency — reconsider it if
the bridge starts costing maintenance. Dropping Shiki for a CodeMirror
`HighlightStyle` would remove the bridge *and* keep colour, at the cost of exact
parity with `TrustyCodeBlock`; that is the fallback if Shiki-per-keystroke ever
proves too slow.
