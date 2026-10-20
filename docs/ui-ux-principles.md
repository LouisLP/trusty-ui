# Trusty UI's UI/UX principles

How a screen built on `@louislp/trusty-ui` should look and read. Written as directives
so a **designer** and a **coding agent** apply them the same way. Attach this
file whenever you prompt an agent to build or restyle a screen.

**Scope:** desktop web, dark mode, screens **built with** the library. Authoring
the library itself is governed by its own `CONTEXT.md` and `README.md`.

**Where the truth lives.** These are the conventions; the values and APIs are in
the code, and the code wins on any conflict:

| Question | Source of truth |
| --- | --- |
| What is a token's value? | `src/styles/tokens/semantic.css` |
| What props does a component take? | its `*.stories.ts` (autodocs) in Storybook |
| Which component do I reach for? | its story's **Use it when** / **Don't use it for** |
| This file disagrees with a component's story | the story wins; report the conflict |

## The five invariants

Break one of these and the screen is wrong, however good it looks.

1. **Reach for the component.** Before writing a `div`, a shadow, a focus ring,
   or a keyboard handler, find the `Trusty*` component that already carries the
   states, the ARIA, and the design. `using-trusty-ui.md` lists every one with
   its **Use it when** / **Don't use it for**; that list, not this file, is the
   catalogue.
2. **Style through semantic tokens.** `var(--color-…)`, `var(--space-…)`,
   `var(--radius-…)`, `var(--border-…)`. A literal `#hex` or `12px` in a screen's
   CSS is a **token gap**: report it rather than bury it.
3. **The app imports `@louislp/trusty-ui/src/styles/main.css` once, at its entry.**
   Skip it and you get the **unstyled render** — structure intact, every
   `var(--…)` unresolved. This is the classic failure; check it first when a
   screen looks inexplicably wrong.
4. **Dark mode only.** One theme, no light variant, no `prefers-color-scheme`.
5. **Desktop web only.** Multi-column layouts still respond — they reflow to the
   window — but no layout targets a phone.

## Voice

**Plain.** Every label, title, empty state and error message states the result
and stops. No exclamation marks, no jokes, no "Oops".

- Confirmations state the result: "Project deleted", "Task updated".
- Failures state what failed: "Upload failed", "Saving the draft failed".
- Empty states name what is missing: "No projects".
- Instructions are imperative: "Reload the page to apply changes".
- Reserve **"please"** for errors the app itself caused. Everything else is a
  plain instruction.
- Reserve **"successfully"** for nothing: "Project deleted" already says it.

Button and link labels are action-first and specific: **Add Project**, not
*Submit*.

## Typography

Three faces, each through its token, all OFL and bundled through Fontsource by
`main.css`:

| Token | Face | For |
| --- | --- | --- |
| `--font-family-display` | Bricolage Grotesque | headings and titles, nothing else |
| `--font-family-sans` | Inter | body text, labels, controls (everything that isn't a heading or code) |
| `--font-family-mono` | JetBrains Mono | code, and only code |

`base.css` already puts the display face on `h1`–`h6`, and the components put it
on their own titles (card, dialog, chart), so a screen reaches for the token only
for a title that isn't a heading element. The display face has no italic: never
italicize a heading. Set `font-variant-ligatures: none` beside the mono token so
`=>` stays two characters. Never name a face directly; a `font-family: Inter`
pins the screen to today's choice.

Sizes are named by **step**, not by pixel: `--font-size-2xs` 10 · `-xs` 12 ·
`-sm` 14 · `-md` 16 · `-lg` 18 · `-xl` 20 · `-2xl` 24 (px at a 16px root, and
larger steps for display use). `--font-size-sm` (14px) is the body default, set in
`base.css`, so text inherits it. Reach for a size token only to depart from it.

Weights: `--font-weight-normal` (400), `--font-weight-semibold` (600),
`--font-weight-bold` (700). Line height is `--line-height-normal` (1.4) unless a
heading needs `-snug` (1.2). Mixed-case text takes no letter-spacing: Inter is
already tracked for UI sizes, and `wide`/`wider` on it reads loose.

**Which style for what**

| Role | Tokens |
| --- | --- |
| Page title | `--font-size-xl` + `--font-weight-bold` |
| Section heading | `--font-size-lg` + `--font-weight-bold` |
| Sub-heading, card and small-section title | `--font-size-sm` + `--font-weight-semibold` |
| Body text | nothing: it inherits `--font-size-sm` + `--font-weight-normal` |
| Title over a group (button row, list) | `--font-size-xs` + `--font-weight-semibold` + `--letter-spacing-widest` + `text-transform: uppercase` |
| In-text link | a plain `<a>`: `base.css` styles it |
| Inline, preview or editor code | `--font-size-sm` + `--font-family-mono` |
| Dense displays, where a lot must fit | `--font-size-xs`, or `--font-size-2xs` at the floor |

A role with no row above has no style yet. Add a row here before inventing one.

**Casing and punctuation**

- **Title Case for titles**, kept short and to one line.
- **Sentence case everywhere else**, and no full stop on the final sentence:
  tooltips, toasts, checkbox and switch and radio labels, menu items, validation
  and error text, and text blocks. Periods separate sentences within a block;
  a single sentence carries none.
- The **link style marks a link inside text**, expands detail, or opens a hover
  card or popover. A standalone action is `<TrustyButton variant="ghost">`.
- **Each heading sits at most one level below the one before it.** A page may
  start at any level — opening on an H2 is fine — and carries a single H1.

## Colour

The palette is combo #2 from
[japanese-colour-combos](https://www.npmjs.com/package/japanese-colour-combos):
**Yellow Orange** (`#f99d1b`) is the accent, **Dark Tyrian Blue** (`#12354e`)
the second colour, both over the combo's own dark neutrals. `tokens.css` names
the combo in one import, and every role below aliases a role-named `--cc-*`
variable rather than a colour-named one, so swapping the combo is a one-line
change. A screen styled through the roles survives that swap untouched; a screen
that hard-codes orange does not.

Status, tag and chart hues are the library's own fixed ramps in
`primitives.css`. A two-colour combo has no red or green, and a status colour
has to mean the same thing whatever the combo.

Every colour comes from a semantic role in `semantic.css`:

- **Text**: `--color-text`, `-toned`, `-muted`, `-inverted`.
- **Surfaces**: `--color-bg`, `-lowered`, `-elevated`, `-accented`, `-sunken`.
- **Borders**: `--color-border`, `-muted`, `-highlight`, `-danger`.
- **Primary**: `--color-primary`, `-hover`, `-active`, `-highlight`, `-muted`,
  `-disabled`, plus `--color-on-primary` for text and icons on a primary fill.
- **Secondary**: `--color-secondary`, `-muted`. The control fill (inputs,
  checkboxes, secondary buttons), drawn from Dark Tyrian Blue.
- **Status**: `--color-{danger,warning,success,info}-{text,surface,surface-subtle}`,
  plus `--color-on-status` for text and icons on a status surface.
- **Decorative**: `--color-tag-*` for tag hues, `--color-chart-series-1` …
  `-5` for chart series, in that order. They tell things apart and mean nothing
  on their own.
- **Shadow**: `--color-shadow`, for the components that own a shadow (below).

A handful more (`--color-control-thumb`, `--color-ghost-surface-subtle`) exist
for the one component that draws them. A screen has no use for them.

Reaching past this list, into `primitives.css` (`--color-blue-500`), a `--cc-*`
variable or a raw hex, is a **primitive leak**: the design should name the role.
Report it. The library holds itself to the same rule, and `token-tiers.spec.ts`
fails any component that breaks it.

**Spend the accent on what the user acts on.** Primary marks the primary action,
the current selection, the checked control and focus. It is not a decoration, a
heading colour or a background wash; a screen painted orange has nothing left to
point with.

- **Text on a primary fill is `--color-on-primary`** (black, for combo #2),
  never `--color-text`. White on Yellow Orange is roughly 2:1.
- **Primary as text, a ring or an indicator on a dark surface is
  `--color-primary-highlight`.** `--color-primary` is the fill.
- **Warning is yellow, not orange**, so it never reads as the accent. Don't
  paint a warning in primary, or an action in warning.

**Contrast.** Text meets WCAG AA's **4.5:1** against its background; icons,
focus rings, control boundaries and other graphics meet **3:1**. Disabled states
are exempt. Every pair the library itself draws already clears it: the Palette
story's `Contrast` check gates the token pairs, and axe fails any story that
drops below. A pair the library never draws (`--color-text-muted` on
`--color-primary-muted`, say) is yours to check.

**Colour always carries a second cue** (an icon, a text label, a shape or a
pattern) so meaning survives for anyone who cannot separate the hues:

- **Status** → `TrustyBadge`, which pairs the colour with its label.
- **Validation** → an icon and a message beside the field, not a red border
  alone; a check on success, not green alone.
- **Charts** → labels, icons, or patterns distinguishing the series.
- **Severity, required fields** → a word or a glyph.
- **Tags** → the label. The hue only helps tell one tag from the next.

## Spacing

`--space-2xs` 2 · `--space-xs` 4 · `--space-sm` 8 · `--space-md` 16 ·
`--space-lg` 24 · `--space-xl` 32 · `--space-2xl` 40 · `--space-3xl` 48 ·
`--space-4xl` 64 (px at a 16px root).

**Padding, cards and containers** — between `--space-sm` (8, the floor) and
`--space-md` (16, the ceiling). Small content takes 8; anything substantial takes
16. Nothing takes more.

**Gaps** — `--space-sm` (8) is the default and the right answer most of the time.
`--space-2xs` (2) is the floor, for small elements only. `--space-xs` (4) sits
between text and an `sm` button.

**Padding ↔ gap** — inside a card padded 16 on every side: **8** between elements
of one group, **16** between two or more sections.

## Radius

`--radius-xs` 2 · `--radius-sm` 4 · `--radius-md` 8 · `--radius-lg` 16 ·
`--radius-full` (a pill).

- 2px is the floor.
- Cards and containers take 4 or 8 — **the bigger the card, the bigger the
  radius**.
- **A nested element's radius is smaller than its parent's**: a card at 8 holds a
  subsection at 4 or 2 — **the bigger the padding, the smaller the nested
  radius**.

## Borders and elevation

`--border-sm` 1px · `--border-md` 2px · `--border-lg` 3px.

- **`--border-md` (2px) is the default** — buttons, the border of a preview
  section inside a card, separators.
- **`--border-sm` (1px)** suits small elements and light separators.
- `--border-lg` (3px) is defined but unused across the library. A screen has no
  occasion to reach for it either; if a design calls for it, say so rather than
  applying it silently.

**Shadows belong to the floating components** — tooltips, hover cards,
popovers, menus, select and combobox content, toasts, and the dialogs — and
arrive with them, all drawn in `--color-shadow`. Everything else separates
with a border or a surface step (`--color-bg-lowered` → `-elevated` →
`-accented`).

**Stacking** uses `--layer-*` (`docked` 100 → `toast` 700), never a hand-picked
`z-index`.

## Sizing and icons

- Control heights come from `--size-control-xs` … `-xl` (18, 24, 32, 40, 48px),
  or from the component's own `size` prop. Pick the step that fits rather than
  setting a height.
- Container widths come from `--size-2xs` … `-xl`.
- **Icons render at 18px by default, and `TrustyIcon` sizes at `1em`** — so the
  knob is the surrounding `font-size`: `font-size: var(--font-size-lg)` gives
  18px. The `size` prop is a separate 8/16/24/32 scale (`xs`…`lg`) with no 18px
  step, so `size="md"` is 24px, not the default.
- Icons are Phosphor regular (`ph:*`), the library's own set: browse it at
  https://icon-sets.iconify.design/icon-sets/ph/. Stay in it. A second
  collection beside Phosphor shows in the stroke weight, and only `ph:*` names
  the components already use render offline; anything else is fetched from the
  Iconify API on first render. Pair an icon with the label on primary actions.

## Layout

- **Three adjacent lines is the limit** — an outlined card inside an outlined
  card inside an outlined container reads as noise. Flatten the nesting, or let a
  surface step carry the separation instead of a border.
- Group related fields and controls; align labels and inputs consistently.
- Keep click targets at `--size-control-md` (32px) or larger.

## Actions

- **The primary CTA sits on the right** of a button row and is the affirmative
  action — *Save*, *Continue*.
- **Cancel sits to its left, as `variant="ghost"`, labelled "Cancel"** — not
  *Discard*.
- **One primary per view or section.** Two primaries in one context is a
  hierarchy the screen cannot express.
- **Actions of equal weight share one style** — all primary, all secondary, or
  all outline. Mixing styles claims a hierarchy; claim it only when it is real.
- **`variant="danger"` marks irreversible actions** — removing entities, and
  little else. Each one is confirmed by a `TrustyAlertDialog`, and sits apart
  from the primary confirm. Its home is a confirmation dialog, a context menu, or
  a dropdown menu; where the main screen needs it, put it in a menu or at the
  bottom of the screen or panel.
- Button order and styling stay identical across every screen and dialog.

## States

Every state the component supports is designed, not just the happy path:
**default, hover, focus, pressed, disabled, loading, empty, error**.

- **Pressed** scales the button to **98%**.
- Transitions run at `--duration-normal` (200ms) for hover and press; reach
  higher only for motion meant to draw the eye.
- Validation and errors appear **inline, beside the field** — through
  `TrustyFormItem` — as well as in any summary.
- Every empty state names what is missing and, where there is one, offers the
  action that fills it.

## Before handing back a screen

Every line here is checkable against the markup you just wrote — grep it, don't
recall it.

- [ ] `grep` the diff for `#` and for `px`: every colour, space, radius, and
      border resolves to a `var(--…)` from `semantic.css`.
- [ ] `grep` the diff for `z-index` and `box-shadow`: neither appears.
- [ ] Every interactive pattern — overlay, menu, field, toast, badge — is an
      `Trusty*` component, not a hand-built `div`.
- [ ] Every piece of text maps to a row of the "Which style for what" table.
- [ ] No card padding exceeds 16px; no nested radius exceeds its parent's; no
      three borders stack.
- [ ] Nowhere does colour carry meaning alone.
- [ ] Primary appears only on actions, selection and focus; text on a primary
      fill is `--color-on-primary`.
- [ ] No `font-family` names a face; every one is a `--font-family-*` token.
- [ ] Every icon is `ph:*`.
- [ ] Titles are Title Case; everything else is sentence case with no trailing
      full stop.
- [ ] One primary action per section; Cancel is ghost, left, labelled "Cancel";
      every danger action has its `TrustyAlertDialog`.
- [ ] Hover, focus, pressed, disabled, loading, empty and error are all designed.
- [ ] Token gaps and primitive leaks are listed in the summary, not silently
      substituted.
