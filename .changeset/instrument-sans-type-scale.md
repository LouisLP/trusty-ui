---
"@louislp/trusty-ui": minor
---

Swap the body face from Inter to Instrument Sans (`--font-family-sans`), and standardise component type sizes.

- Titles take the display face everywhere: TrustyAlert, TrustyBanner, toasts, TrustyPopover, TrustyHoverCard and TrustyForm's error summary join TrustyCard, TrustyDialog and the charts.
- Titles follow one scale: dialogs `lg`, cards/charts/lightbox `md`, compact titles `sm`. TrustyPopover's title drops its uppercase tracking. TrustyCard and TrustyAlertDialog descriptions go from `xs` to `sm`.
- Control labels on a `md` control are `sm`: TrustyToggle, TrustyToggleGroup, TrustyTabs and TrustyNavigationTabs move up from `xs`.
- Descenders no longer clip in TrustyButton, TrustyTag/TrustyFilterTag and TrustySelect's value.

Instrument Sans covers Latin only; Cyrillic, Greek and Vietnamese text now falls back to the system sans.
