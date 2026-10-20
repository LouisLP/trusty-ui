# @louislp/trusty-ui

## 1.1.0

### Minor Changes

- d6a25f4: Swap the body face from Inter to Instrument Sans (`--font-family-sans`), and standardise component type sizes.
  
  - Titles take the display face everywhere: TrustyAlert, TrustyBanner, toasts, TrustyPopover, TrustyHoverCard and TrustyForm's error summary join TrustyCard, TrustyDialog and the charts.
  - Titles follow one scale: dialogs `lg`, cards/charts/lightbox `md`, compact titles `sm`. TrustyPopover's title drops its uppercase tracking. TrustyCard and TrustyAlertDialog descriptions go from `xs` to `sm`.
  - Control labels on a `md` control are `sm`: TrustyToggle, TrustyToggleGroup, TrustyTabs and TrustyNavigationTabs move up from `xs`.
  - Descenders no longer clip in TrustyButton, TrustyTag/TrustyFilterTag and TrustySelect's value.
  
  Instrument Sans covers Latin only; Cyrillic, Greek and Vietnamese text now falls back to the system sans.

### Patch Changes

- dec9db3: Restyle two colour choices. `TrustyButton`'s primary variant now paints a deep orange fill with a light orange label instead of black on bright orange, through five new semantic tokens: `--color-primary-surface` (`-hover`, `-active`) and `--color-on-primary-surface` (`-hover`). `TrustyCodeBlock`, read and edit mode alike, now highlights with Shiki's Ayu Mirage theme in place of Tokyo Night, whose orange and amber sit with the Dark Tyrian Blue code surface.
- 1039a3a: Primary button: the accent as its label, on a deep accent fill, in place of the mid-orange fill and pale label. `--color-primary-surface*` and `--color-on-primary-surface*` change value, not name. TrustyCodeBlock's read view sits on `--color-secondary` (dark blue, matching its editor) instead of the lighter `--color-secondary-muted`.

## 1.0.0

First public release: the Vue 3 component library on Reka UI primitives, its design tokens (Japanese colour combo #2), the Bricolage Grotesque, Inter and JetBrains Mono fonts, and the Phosphor icons the components draw, all from one entry.
