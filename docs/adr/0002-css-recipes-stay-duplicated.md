# ADR 0002 — Composed CSS recipes stay duplicated, for now

**Status:** accepted, 2026-08-28
**Affects:** [CONTEXT.md](../../CONTEXT.md#token-tiers), every component's scoped
`<style>` block

## Context

The token tiers name *values*. Nothing names **combinations**, so several
recipes are spelled out by hand in every component that wants them:

| Recipe | Files |
| --- | --- |
| The focus ring — `outline: var(--border-md) solid var(--color-primary-highlight)` plus its offset | 20 |
| The control shell — `--size-control-md` min-height, `--color-secondary` fill, `--color-border` border, the two-property transition | 14 |
| The listbox item — 12 identical declarations | 4, verbatim: `TrustySelect`, `TrustyCombobox`, `TrustyContextMenu`, `TrustyDropdownMenu` |

`pnpm audit:code` reports the last of these as a clone group. The cost is real
and concentrated: changing the focus ring is a 20-file edit with nothing to tell
you that you missed one, and the README already records a known
`--color-primary` contrast problem that CI's `test:a11y` job is non-blocking
for — a fix that will have to land in all 20 places.

Two related duplications have the same root and were deliberately left alone by
the architecture pass of 2026-08-28, because no composition change can reach
them:

- `TrustyAlertDialog` reproduces `DialogBase`'s overlay, centering and four
  keyframes. It cannot simply compose `DialogBase`: it wraps Reka's
  `AlertDialog*` primitives, which are a *different component* from `Dialog*` —
  `role="alertdialog"`, no outside-click dismissal, `Action`/`Cancel` parts.
  Only its presentation duplicates.
- `NumberFieldBase` reproduces `TextInputBase`'s input shell for the same
  reason: Reka's `NumberFieldRoot` renders its own root, so composing would
  nest two shells.

Scoped CSS is what makes this unfixable by refactoring: a scoped rule is
rewritten with the *defining* component's `data-v` attribute, so one component
can never hand a rule to another. Sharing requires a rule that is not scoped to
either — i.e. somewhere new for it to live.

## Decision

**Leave the duplication in place.** Do not introduce a recipe tier, and do not
add composed values to the semantic tier.

Both fixes were costed. They are not rejected as wrong — they are deferred
because the choice between them is a design-system decision about what the token
vocabulary *is*, and that is worth making deliberately rather than as a side
effect of a duplication cleanup:

1. **A third tier of recipe classes** (`recipes.css`, composed from semantic
   tokens, referenced by class). Fixes all three recipes, and would mean
   components carry utility classes — a different authoring style from the one
   every component uses today.
2. **Composite values in the semantic tier** (`--focus-ring: …`). Smaller, no
   invariant change, but each component still writes the property; it only stops
   repeating the value. Does nothing for the listbox item or the dialog
   keyframes, which are whole rule *sets*.

Either way `CONTEXT.md`'s "Token tiers" section is load-bearing here: it states
there are exactly two tiers and that components may only see the semantic one,
and that text is **fenced for consumers** — it ships verbatim in
`context/using-trusty-ui.md`. Option 1 changes what the library tells every
consuming app about its own token vocabulary.

## Consequences

- Changing a shared recipe stays an N-file edit. The `--color-primary` contrast
  fix in particular will touch all 20 focus-ring sites.
- `audit:code` continues to report the listbox-item clone group. That is a true
  positive, deliberately tolerated — do not silence it in `.fallowrc.json`,
  because the day it stops being tolerated is the day this ADR gets revisited.
- A future architecture review will find this duplication again. It should read
  this file first, and only re-raise it with a recommendation *between the two
  options above*, not as a fresh finding.

## Revisit when

- The `--color-primary` contrast fix is scheduled — it is the first change that
  actually has to be made in 20 places at once, and is the natural moment to pay
  for the tier instead.
- A fourth component copies the listbox-item rule, or a third copies a dialog's
  keyframes.
- The design system gains a second theme, where a recipe's *shape* (not just its
  values) has to vary.
