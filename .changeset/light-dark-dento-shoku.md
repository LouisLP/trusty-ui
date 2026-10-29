---
"@louislp/trusty-ui": minor
---

Light mode. Every semantic colour role is now a `light-dark()` pair and `:root` declares `color-scheme: light dark`, so the library follows the OS; pin a mode with `:root { color-scheme: dark }` (or `light`) in the app's CSS. Code highlighting follows too: GitHub Light Default in light mode, Ayu Mirage in dark. Charts re-read their colours when the OS scheme flips.

Status and tag hues move to traditional Japanese dyes: kurenai (danger), kariyasu (warning), moegi (success) and hanada (info); ruri, haizakura, fuji, koke, byakugun, botan and kuri for the tags. The `--color-red-*`, `-yellow-*`, `-green-*`, `-blue-*`, `-stone-*`, `-purple-*`, `-forest-*`, `-mint-*`, `-magenta-*` and `-brown-*` primitives are gone; the semantic `--color-*` roles keep their names. In light mode, status surfaces are pale under ink, so `--color-on-status` is ink there.

`--color-chart-series-1…5` are removed from the semantic tier: the chart components own their series colours as `--trusty-chart-series-*`, which is the hook to override.

TrustyButton: the primary variant is a deep persimmon fill under a white label with a top-edge sheen; secondary is a tonal seiji fill with a seiji label and a hairline ring. No variant turns its label orange on press any more, and the outline variant's pressed border is neutral. Corners go from `--radius-xs` to `--radius-sm`, labels from bold to semibold. New tokens: `--color-on-secondary`, `--color-sheen`.

Colour arithmetic is now perceptual throughout: tokens and components mix in oklab instead of srgb, and the translucent tokens (`--color-*-surface-subtle`, `--color-ghost-surface-subtle`, `--color-shadow`, `--color-sheen`) take their alpha via relative colour syntax on the oklch primitive. Two-colour mixes such as `--color-primary-muted` shift slightly in value.
