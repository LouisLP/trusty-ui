/**
 * An icon name accepted by `<TrustyIcon>`: any Iconify name in `collection:icon` form (`ph:house`, `mdi:home`).
 *
 * The template literal, not plain `string`, so a bare name — say one left over from the retired local set — fails `type-check` instead of rendering nothing. Not a union of real names either: with ~9k Phosphor glyphs alone `vue-tsc` cannot reduce it (`TS2590`), and consumers reach every Iconify collection, not one.
 *
 * Browse names at https://icon-sets.iconify.design/. The library's own default is Phosphor regular (`ph:*`).
 */
export type TrustyIconName = `${string}:${string}`
