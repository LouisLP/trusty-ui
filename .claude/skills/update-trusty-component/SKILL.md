---
name: update-trusty-component
description: Change an existing Trusty UI component. Use when restyling, adding a prop or variant, fixing a component's behaviour, or bringing a TrustyX.vue back in line with the tokens or a reference.
---

# Update a Trusty UI component

An existing component is a **published contract** — consumers import it from
`@louislp/trusty-ui` and pass the props it advertises. The work is therefore a diff, not
a rewrite: change what the ask actually asks for, and leave the rest of the
surface alone.

The prompt carries the ask, sometimes with a screenshot or sketch. There is no
design file: values come from the tokens, by the
[token audit](../../../docs/agents/token-audit.md).

## 1. Read the component as it stands

All three files, before touching any of them:

- `TrustyX.vue` — the markup it commits to, the primitive underneath, its CSS.
- `TrustyX.stories.ts` — **the API reference.** It is the only prop documentation
  the repo keeps, deliberately, so it cannot drift
  ([CLAUDE.md](../../../CLAUDE.md#storybook-is-the-component-reference)). Props
  written from memory are how wrong props get shipped.
- `TrustyX.spec.ts` — the behaviour that is already pinned. A test failing after
  your change is a question to answer, not a line to delete.

## 2. Turn the ask into a change list

Run the [token audit](../../../docs/agents/token-audit.md) over every value the
ask touches. Here its output is a **change list**: for each value, does the
current CSS already carry it, or does it change, and to which token? A restyle
that moves a role (a new state colour, a new size step) is checked against
[`ui-ux-principles.md`](../../../docs/ui-ux-principles.md) too. State the list
before editing, so the blast radius is visible while it is still cheap.

Behaviour that the ask implies but no primitive provides yet sends you to the
**`reka-ui`** skill — a new state (a disclosure, a floating panel) may mean the
component's primitive was the wrong one.

## 3. Change all four files together

The four things a component ships
([CLAUDE.md](../../../CLAUDE.md#every-component-ships-four-things)) move as a
set, and the last two are the ones that rot:

- a new or renamed prop needs its `argTypes` entry, its `args` default, and a
  story that exercises it;
- new behaviour needs a spec case;
- a new export (a keys file, a type) needs its line in the category `index.ts`.

Styling stays on semantic tokens, in plain modern CSS
([the rules](../../../README.md#the-rules)).

## 4. Weigh what the change breaks

| Change | Consumers see | Changeset |
| --- | --- | --- |
| pure restyle, same API | nothing | `patch` |
| new optional prop, new variant, new slot | nothing | `minor` |
| renamed or removed prop, changed default, different rendered element | a break at their call sites | `major`, and name the migration in the changeset body |

A changed default is a break even though nothing in the types moves — call it out.

Then check the two silent [mirror pairs](../../../CONTEXT.md#mirror-pairs) this
work can disturb: an icon a component starts or stops naming needs `pnpm generate:icons`,
and a new `exports` subpath needs the same line in `publishConfig.exports`.

## 5. Re-place it if the depth moved

Composition depth is a measurement
([CONTEXT.md](../../../CONTEXT.md#composition-depth)), so a change that makes a
component compose a second public component moves its folder. And when the change
makes a *specialized* pattern repeat a third time, propose promoting it to a
*base* with a variant prop instead of adding the wrapper — say so rather than
quietly adding the fourth.

## 6. Gates

Run the five CI gates [AGENTS.md](../../../AGENTS.md#commands) lists: `pnpm lint`,
`pnpm type-check`, `pnpm test:unit`, `pnpm generate:icons --check`,
`pnpm generate:context --check`; `pnpm test:storybook` too when markup or
colours changed. Open the story and check every row of the change list renders,
then `pnpm changeset` with the bump from step 4.

## Done means

- the diff covers what was asked and nothing else;
- stories and spec describe the component as it now is;
- the five gates pass and a changeset carries the right bump;
- every **token gap** and **primitive leak** the audit found is in the summary,
  unresolved ones named as such.
