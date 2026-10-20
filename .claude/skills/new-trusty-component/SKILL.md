---
name: new-trusty-component
description: Build a new Trusty UI component. Use when adding a component that does not exist yet, or turning a sketch, screenshot or reference UI into a new TrustyX.vue.
---

# New Trusty UI component

The prompt should carry the component's name and what it is for. A screenshot,
sketch or reference UI is welcome but optional: there is no design file, and the
look is derived from the tokens, the principles and the nearest neighbour
([`token-audit.md`](../../../docs/agents/token-audit.md) says how). Ask for
the name and purpose if either is missing.

Work the steps in order. Each one narrows what the next has to decide.

## 1. Settle the brief

Write down, before any markup: what the component does, every state it has
(default, hover, focus, disabled, invalid, open, loading, empty — whichever
apply), its sizes, and the existing component it sits nearest to. Read
[`ui-ux-principles.md`](../../../docs/ui-ux-principles.md) for the roles those
states take — where the accent goes, the type scale, the voice of any text it
renders. A reference image in the prompt feeds this list; its pixel values do
not.

Done when the state list is complete enough to pick a primitive from: the
states tell you which primitive you need.

## 2. Find the primitive underneath

Invoke the **`reka-ui`** skill. A component's behaviour comes from a headless
primitive or from a native element — deciding this before writing markup is what
keeps the a11y free rather than retrofitted.

## 3. Place it

Composition depth decides the folder, never UI purpose:
[CONTEXT.md](../../../CONTEXT.md#composition-depth) defines the five categories,
and the [README's ladder](../../../README.md#where-the-component-goes) walks them
as questions — stop at the first that fits.

Two traps at this step:

- **Storybook's title is grouped by purpose** (`Actions/…`, `Form/Controls/…`,
  `Overlays/…`), so it will not match the folder name, and that is correct.
- A pattern that already exists twice as a *specialized* wrapper wants promoting
  into a *base* with a variant prop rather than a third wrapper.

## 4. Scaffold it, then follow the precedent

```sh
pnpm new:component TrustyThing --depth base   # base | specialized | form | composite | private
```

That writes the `.vue`, its spec, and for a public component its stories, the
export line and a `minor` changeset — the shape the inventory spec demands. Every
judgement call is left as a `TODO`, and the guidance gate fails until each one is
answered.

Then read the nearest existing component in the same category — its `.vue`, its
`.spec.ts`, and its `.stories.ts` — and match its shape: prop naming, the
`data-*` attributes it reflects, how it exposes state, how its scoped CSS is
organised, how its stories are written. `TrustyButton` is the reference for a
plain base control; `TrustyTextInput` for a form control; `TrustyBarChart` for a
specialized skin over a private base.

Precedent beats invention here. A component that reads like its neighbours is
one an agent can extend later; a novel one is a fork in the library's style.

Simplify the interface. Too many variations or props are ways for an engineer
to misuse the component or mess up the design.

## 5. Fill in the four files

[CLAUDE.md](../../../CLAUDE.md#every-component-ships-four-things) owns the list,
and `component-inventory.spec.ts` fails if one is missing. Replace every `TODO`
the scaffold left — the Storybook title, the guidance, the changeset — and grow
the spec past its one render test.

A component that declares `invalid` is claiming the form-control contract: give
it a row in `TrustyFormItem.conformance.spec.ts`, which fails until you do.

Style through semantic tokens, keep the API minimal, give every interaction a
keyboard path — [the rules](../../../README.md#the-rules). Run the
[token audit](../../../docs/agents/token-audit.md) on every value the CSS sets,
and post its table before writing the CSS.

A component that names a new icon (Phosphor, `ph:*`) regenerates
([`src/icons/README.md`](../../../src/icons/README.md)): that is a
[mirror pair](../../../CONTEXT.md#mirror-pairs).

## 6. Verify against the brief and the gates

- `pnpm generate:context`, then run the five CI gates
  [AGENTS.md](../../../AGENTS.md#commands) lists: `pnpm lint`, `pnpm type-check`,
  `pnpm test:unit`, `pnpm generate:icons --check`, `pnpm generate:context --check`.
- Open the story beside the nearest neighbour from step 1, and beside the
  reference image if the prompt carried one: every state from the brief renders,
  and the two read as one library.
- Fill in the changeset the scaffold wrote — a new component is a `minor`.

## Done means

- the four files exist, and the component imports cleanly from `@louislp/trusty-ui`;
- the five gates pass;
- every value the CSS sets is accounted for by the token audit, with any
  **token gap** or **primitive leak** reported in the summary rather than
  papered over with a literal;
- a story renders every state from the brief.
