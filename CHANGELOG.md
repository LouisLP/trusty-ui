# @louislp/trusty-ui

## 1.1.0

### Minor Changes

- d6a25f4: Swap the body face from Inter to Instrument Sans (`--font-family-sans`), and standardise component type sizes.
  
  - Titles take the display face everywhere: TrustyAlert, TrustyBanner, toasts, TrustyPopover, TrustyHoverCard and TrustyForm's error summary join TrustyCard, TrustyDialog and the charts.
  - Titles follow one scale: dialogs `lg`, cards/charts/lightbox `md`, compact titles `sm`. TrustyPopover's title drops its uppercase tracking. TrustyCard and TrustyAlertDialog descriptions go from `xs` to `sm`.
  - Control labels on a `md` control are `sm`: TrustyToggle, TrustyToggleGroup, TrustyTabs and TrustyNavigationTabs move up from `xs`.
  - Descenders no longer clip in TrustyButton, TrustyTag/TrustyFilterTag and TrustySelect's value.
  
  Instrument Sans covers Latin only; Cyrillic, Greek and Vietnamese text now falls back to the system sans.
- 0f914df: New theme: kaki (persimmon orange) is the primary, seiji (pine green) the secondary, over sumi ink neutrals, in place of japanese-colour-combos #2. The dependency is gone, and with it every `--cc-*` variable; the semantic `--color-*` roles keep their names. Every primitive is now oklch, the status and tag ramps included.
- 46ec752: Light mode. Every semantic colour role is now a `light-dark()` pair and `:root` declares `color-scheme: light dark`, so the library follows the OS; pin a mode with `:root { color-scheme: dark }` (or `light`) in the app's CSS. Code highlighting follows too: GitHub Light Default in light mode, Ayu Mirage in dark. Charts re-read their colours when the OS scheme flips.
  
  Status and tag hues move to traditional Japanese dyes: kurenai (danger), kariyasu (warning), moegi (success) and hanada (info); ruri, haizakura, fuji, koke, byakugun, botan and kuri for the tags. The `--color-red-*`, `-yellow-*`, `-green-*`, `-blue-*`, `-stone-*`, `-purple-*`, `-forest-*`, `-mint-*`, `-magenta-*` and `-brown-*` primitives are gone; the semantic `--color-*` roles keep their names. In light mode, status surfaces are pale under ink, so `--color-on-status` is ink there.
  
  `--color-chart-series-1…5` are removed from the semantic tier: the chart components own their series colours as `--trusty-chart-series-*`, which is the hook to override.
  
  TrustyButton: the primary variant is a deep persimmon fill under a white label with a top-edge sheen; secondary is a tonal seiji fill with a seiji label and a hairline ring. No variant turns its label orange on press any more, and the outline variant's pressed border is neutral. Corners go from `--radius-xs` to `--radius-sm`, labels from bold to semibold. New tokens: `--color-on-secondary`, `--color-sheen`.
  
  Colour arithmetic is now perceptual throughout: tokens and components mix in oklab instead of srgb, and the translucent tokens (`--color-*-surface-subtle`, `--color-ghost-surface-subtle`, `--color-shadow`, `--color-sheen`) take their alpha via relative colour syntax on the oklch primitive. Two-colour mixes such as `--color-primary-muted` shift slightly in value.
- edcfeb0: TrustyStarburst: decorative seiji/kaki emphasis rays (`stamp`, `burst`, `spark`) with a hand-drawn three-frame line boil, still under reduced motion. Adds `--color-secondary-highlight` and `--duration-boil`.

### Patch Changes

- 0f914df: New depth roles, `--color-bg-inset` and `--color-bg-inset-muted`: the neutral ground of every field, checkbox and radio box, code well and inline code, in place of the seiji `--color-secondary` fill, which now paints secondary actions only. TrustyTree's active branch recedes into the inset instead of tinting green. TrustySplitter's resting handle is `--color-border`, so it no longer vanishes into a lowered page. TrustyTag and TrustyFilterTag default to mint.
- dec9db3: Restyle two colour choices. `TrustyButton`'s primary variant now paints a deep orange fill with a light orange label instead of black on bright orange, through five new semantic tokens: `--color-primary-surface` (`-hover`, `-active`) and `--color-on-primary-surface` (`-hover`). `TrustyCodeBlock`, read and edit mode alike, now highlights with Shiki's Ayu Mirage theme in place of Tokyo Night, whose orange and amber sit with the Dark Tyrian Blue code surface.
- 1039a3a: Primary button: the accent as its label, on a deep accent fill, in place of the mid-orange fill and pale label. `--color-primary-surface*` and `--color-on-primary-surface*` change value, not name. TrustyCodeBlock's read view sits on `--color-secondary` (dark blue, matching its editor) instead of the lighter `--color-secondary-muted`.

## 1.0.0

First public release: the Vue 3 component library on Reka UI primitives, its design tokens (Japanese colour combo #2), the Bricolage Grotesque, Inter and JetBrains Mono fonts, and the Phosphor icons the components draw, all from one entry.
