# Token audit

Trusty UI has no design file. A component's look is derived, not transcribed,
from three sources, in this order of authority:

1. [`semantic.css`](../../src/styles/tokens/semantic.css) — every value: colour,
   spacing, radius, border, type, duration, shadow.
2. [`ui-ux-principles.md`](../ui-ux-principles.md) — which role a value plays:
   where the accent goes, the type scale, spacing rhythm, states.
3. **The nearest existing component** — how those tokens are already combined
   for this kind of thing (its control height, padding, focus ring, hover wash).

A screenshot, sketch, or reference UI in the prompt is evidence of **intent**:
the layout, the states, the hierarchy. Its pixel values are never the source;
each one maps onto a token by role, or it is a gap.

Read by [`new-trusty-component`](../../.claude/skills/new-trusty-component/SKILL.md)
and [`update-trusty-component`](../../.claude/skills/update-trusty-component/SKILL.md).

## The audit

Every value the component's scoped CSS sets gets one of three verdicts, and
**each value must be accounted for**: colour, spacing, radius, border, font
size, weight, line height, duration, shadow, blur.

| Verdict | What it means | What you do |
| --- | --- | --- |
| **match** | a semantic token carries that value *and* that role | use `var(--token)` |
| **token gap** | no semantic token fits the role, or the value sits between two steps of a scale | report it, loudly, before writing the CSS |
| **primitive leak** | the only token that fits lives in `primitives.css` or `--cc-*`, or the prompt names a palette colour (`blue-500`) where a role belongs | report it, and name the semantic role it needs — [components may not reference the primitive tier](../../CONTEXT.md#token-tiers), and `token-tiers.spec.ts` fails if one does |

Match by **role first, value second**: a border that happens to equal
`--color-primary` is still `--color-border` if it is a border. Reach for the
nearest semantic token and state the substitution; a literal `#hex` or `12px`
in a component's CSS is how a gap gets buried instead of fixed.

## Reporting a gap

Surface the audit as a table in your response **before** writing CSS, and
repeat any unresolved rows in the final summary:

```
Token audit
| Needed                   | Source                     | Token                                 | Verdict |
| control height           | TrustyTextInput            | --size-control-md                     | match |
| 6px avatar gap           | reference screenshot       | --space-sm (8px)                      | token gap — no 6px step; used --space-sm |
| "the blue from the logo" | prompt                     | --color-info-text                     | primitive leak — prompt named a hue; info role chosen |
```

Then split by consequence:

- A gap in a value that **carries meaning** — a state colour, a semantic
  surface, a new size step the system would have to grow — is a design-system
  decision. Ask before inventing it.
- A one-off cosmetic difference inside an existing scale: use the nearest token,
  say which and by how much you moved, and carry on.

**No component change is done while a token gap sits unreported.** Adding a
token to `semantic.css` is a change to the design system's public API, so it
happens deliberately and with the gap named — never as a silent side effect of
building one component.
