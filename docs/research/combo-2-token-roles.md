# Mapping combo 2 onto token roles

Prototype for [#8](https://github.com/LouisLP/trusty-ui/issues/8) (map
[#1](https://github.com/LouisLP/trusty-ui/issues/1)), built on the findings of
[#7](https://github.com/LouisLP/trusty-ui/issues/7). Branch
`prototype/combo-2-token-roles`. Open Storybook at **Foundations/Palette**:
`Roles` shows every semantic colour resolved live, `Contrast` measures every
pair a component draws, and `Components` puts the real components on each
surface.

## The swap mechanism

`tokens.css` imports `japanese-colour-combos/2.css` (pinned at `0.1.0`, a
runtime `dependency`, since `main.css` ships as source and the consumer's
bundler resolves the import). That is the only place the combo id appears.
`semantic.css` aliases **role-named** `--cc-*` variables only (`canvas`, `ink`,
`accent`, `accent-2`, `neutral-*`), never colour-named ones, so changing `2` to
`N` re-skins the library and touches nothing else. `color-scheme: dark` on
`:root` picks the dark half of the combo's `light-dark()` pairs.

The `Contrast` story is the swap gate. Its `play` function fails when any pair
drops below its AA floor (4.5:1 for text, 3:1 for fills, rings and
boundaries), so `pnpm test:storybook` after a swap tells you whether the new
combo holds. I ran it against combos 1, 2, 50, 120 and 250 in Chromium, and
swept the same 53 pairs over all 348 combos in Node: **345 pass**. The three
that don't (37, 134, 172) fail one pair, `text-muted` on `secondary-muted`.

## The mapping (dark)

| trusty-ui role | source | combo 2 |
| --- | --- | --- |
| `--color-text` | `ink` | `#e6ecf1` |
| `--color-text-toned` | `neutral-200` | `#c4c8cc` |
| `--color-text-muted` | `ink-muted` | `#a0a5aa` |
| `--color-text-inverted` | `canvas` | `#0f1214` |
| `--color-bg-sunken` | `neutral-950` | `#030304` |
| `--color-bg-lowered` | `canvas` | `#0f1214` |
| `--color-bg` | `surface` | `#191c1f` |
| `--color-bg-elevated` | `surface-muted` | `#242a2e` |
| `--color-bg-accented` | `neutral-800` | `#313437` |
| `--color-border` | `border` | `#323c44` |
| `--color-border-muted` | `neutral-800` | `#313437` |
| `--color-border-highlight` | `neutral-500` | `#71767b` |
| `--color-primary` | `accent` | `#f99d1b` |
| `--color-on-primary` (new) | `on-accent` | `#000000` |
| `--color-primary-hover` (new) | `accent` 80% + inverse of `on-accent` | `#fab149` |
| `--color-primary-active` (new) | `accent` 65% + inverse of `on-accent` | `#fbbf6b` |
| `--color-primary-highlight` | `accent-text` | `#f99d1b` |
| `--color-primary-muted` | `accent` 30% into `canvas` | `#553c16` |
| `--color-primary-disabled` | `accent-800` | `#4d2c00` |
| `--color-secondary` | `accent-2-900` | `#041c2d` |
| `--color-secondary-muted` | `accent-2-800` | `#12354e` (the Wada hex) |
| `--color-neutral-text` | `ink-muted` | `#a0a5aa` |
| `--color-ghost-surface-subtle` | `accent` at 8% | |
| `--color-shadow` | `neutral-950` at 80% | |
| status (`danger`, `warning`, `success`, `info`) | our own primitives | unchanged, except warning |

trusty-ui has five surface tiers and the combo three, so `bg` moved up to
`surface` and `canvas` became `bg-lowered` (the app's ground, which is what
Storybook already painted). `neutral-950` and `neutral-800` cap each end.

## Where the obvious mapping broke

Four places, each caught by the gate rather than by eye:

- **Hover and press fills.** #7 suggested `accent-200` / `accent-400`. That
  holds for combo 2 but fails on **101 of 348** combos: wherever `on-accent` is
  white, a lighter step loses contrast under it. Both states now mix the accent
  _away_ from `on-accent` (`rgb(from var(--cc-on-accent) calc(255 - r) …)`), so
  they can only gain contrast. With that, the on-primary pairs pass on all 348.
- **`--color-primary-highlight` was doing two jobs.** 60-odd uses are text,
  focus rings and indicators on dark surfaces; two (TrustyButton, TrustyCheckbox
  hover) are fills under text. No single value serves both on every combo, so
  the fills moved to the new `--color-primary-hover`, and highlight became
  `accent-text`, which the combo promises at 4.5:1. For combo 2 that means
  links and rings are the brand orange itself rather than a lighter tint.
- **`--color-primary-muted` carries body text.** CodeMirror paints its
  selection with it. `accent-400` would have put ink on `#ca7c00` (2.76:1); a 30% wash over canvas keeps ink above 6.3:1 on every combo.
- **`border-strong` is promised 3:1 on canvas only.** On `surface-muted` it is
  2.36:1, so `border-highlight` uses `neutral-500` (3.17:1 there).

## Secondary is a control surface, not a brand hue

trusty-ui's `--color-secondary` fills inputs, secondary buttons, checkboxes and
inline code: 43 uses, all of them grounds with text on top. Mapping it to the
`accent-2` role (`#527692`) would have turned every input blue. It takes the
dark end of Dark Tyrian Blue instead, `accent-2-900` at rest and the Wada hex
`#12354e` on hover, which is where the combo's second colour actually shows.
`text-muted` (placeholders) stays at 6.99:1 and 5.14:1 on them.

## Status colours

The combo has none, so they stay in `primitives.css`. They read better than
before (the canvas is darker than the old midnight), and every status text
passes 4.5:1 on `bg-lowered`, `bg` and `bg-elevated`. The exception was
**warning**: `#ffa000` sat 1.04:1 from the new primary, so a warning was
indistinguishable from a primary indicator. It moved to `yellow-500`
`#fbf47b`, with a new `--color-yellow-muted` `#5d5d3b` surface.

## What changed in components

Text on a primary fill now uses `--color-on-primary`: TrustyButton `primary`
(all states; disabled text moved from `info-text` to `text-muted`), the
TrustyCheckbox check mark, and the active TrustyStepper indicator.
TrustyToggle and TrustyToggleGroup painted their pressed state with
`--color-text-dimmed`, a text colour, under ink (2.08:1 now, about 4.3:1
before); they use `--color-secondary-muted` instead. Primitives the
combo replaced (`slate`, `midnight`, `grey`, trusty-ui's own `neutral`,
`orange-muted`) are gone; nothing outside `semantic.css` referenced them.
Storybook's chrome colours in `.storybook/preview.ts` follow the combo.

## The a11y gate

`pnpm test:a11y` (axe violations as failures) on `main` at `ef64032`: **118
failed** of 371. On this branch: **21 failed** of 374. Most of the drop is
`color-contrast`, the `--color-primary` failure that kept the job advisory.

What's left is mostly not colour: 20 `label-content-name-mismatch` (every
TrustyStepper and TrustyToast story), 3 `aria-input-field-name` (TrustySlider), 3
`aria-hidden-focus`. Four `color-contrast` hits remain, all on disabled
controls (TrustyEditableText, TrustyEditableNumber, TrustyTagInput), which WCAG
exempts but axe can't tell apart. Clear all 21 and the job can gate.

## `text-dimmed` is gone

Mapped onto the combo, `text-muted` (`neutral-300`, `#a5aaae`) and
`text-dimmed` (`ink-muted`, `#a0a5aa`) landed 1.06:1 apart. The combo has no
step between `ink-muted` and `neutral-200`, and nothing below `ink-muted` holds
AA, so a dimmer tier has no room. They merged into `--color-text-muted` at
`ink-muted`, and every `text-dimmed` use moved over. Disabled labels and
placeholders now share a colour with secondary text; on screen that was
already true. If disabled ever needs its own look, it should be a
`--color-text-disabled` that the gate exempts, not a third grey.

## Open questions

- **TrustySwitch's white thumb on `primary-highlight`** is a graphic on a light
  orange. It isn't in the gate yet; it needs an `on-primary` thumb or a darker
  track.
- **Hover visibility.** On a few combos the derived hover sits 1.02:1 from rest
  (an accent already near white, mixed toward white). AA-safe, barely visible.
- **Light mode** is one line for the combo roles, but the neutral-step tiers
  and the status primitives are dark-only values. They'd need their own
  `light-dark()` pairs.
- `primitives.css` claims "Stylelint enforces this". There is no Stylelint in
  the repo.
- Chart series and tag hues (`blue-500`, `orange-400` …) are untouched and
  still referenced straight from components.
