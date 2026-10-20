# Domain Docs

How the engineering skills consume this repo's domain documentation.

`trusty-ui` is **single-context** — one [`CONTEXT.md`](../../CONTEXT.md) and one
`docs/adr/` at the repo root. There is no `CONTEXT-MAP.md`: this is a
single-package repo, `pnpm-workspace.yaml` is kept only for pnpm's own settings,
and an untracked `packages/` directory is leftover scaffolding from the
single-package refactor, not a multi-package layout.

## Before exploring, read these

- **[`CONTEXT.md`](../../CONTEXT.md)** — the vocabulary and the invariants.
- **`docs/adr/`** — the ADRs touching the area you're about to work in. This
  directory does not exist yet; if it's missing, **proceed silently**. Don't
  flag its absence and don't propose creating it upfront. `/domain-modeling`
  writes an ADR when a decision actually gets made.

## File structure

```
/
├── CONTEXT.md           ← glossary + invariants
├── AGENTS.md            ← commands, pointers, release rules (CLAUDE.md symlinks here)
├── README.md            ← setup, form system, authoring rules
├── docs/
│   ├── adr/             ← 0001-….md, created lazily
│   └── agents/          ← this file, plus issue-tracker and triage-label config
└── src/
```

If this repo ever splits into genuine sub-packages, the multi-context layout is
a root `CONTEXT-MAP.md` pointing at one `CONTEXT.md` per context, with a
context-scoped `docs/adr/` beside each.

## Use the glossary's vocabulary

When your output names a domain concept — an issue title, a refactor proposal, a
hypothesis, a test name — use the term as `CONTEXT.md` defines it, not a synonym
of it. "A composite that wraps two controls" lands; "a wrapper widget thing"
does not.

A concept missing from the glossary is a signal, not a blocker: either you're
inventing language the project doesn't use (reconsider), or there's a real gap
(note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it rather than silently
overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_

## Keep the glossary true

`CONTEXT.md` is one half of a [mirror
pair](../../CONTEXT.md#mirror-pairs): nothing fails when it drifts from
`src/components/`. When work you do makes a line in it wrong — a new category
member, a promoted `specialized/` component, a changed invariant — fix that line
in the same change.
