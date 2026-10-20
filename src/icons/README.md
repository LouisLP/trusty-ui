# Icons

Every icon is an [Iconify](https://icon-sets.iconify.design/) name in
`collection:icon` form. The library's default collection is
[Phosphor](https://icon-sets.iconify.design/icon-sets/ph/), regular weight
(`ph:*`). This folder is **data only** — no Vue. The renderer is
[`<TrustyIcon>`](../components/base/TrustyIcon).

## What it exports

The package entry re-exports one thing from here:

```ts
import type { TrustyIconName } from '@louislp/trusty-ui'
```

`TrustyIconName` is `` `${string}:${string}` ``: any Iconify name type-checks, a
bare `'close'` does not. Annotate your own `icon` props with it.

## Bundled vs fetched

`icons.generated.ts` holds the Iconify data for every icon the library's own
components name, so those render offline, synchronously, with no API request.
`<TrustyIcon>` hands `<Icon>` that data when it has it, and the name otherwise:

```vue
<Icon :icon="bundledIcons[name] ?? name" :ssr="true" />
```

Any other name — `mdi:home`, a Phosphor glyph no component uses — is fetched
from the Iconify API on first render. `@iconify/vue` is a peer dependency, so a
consumer's `addCollection`, `addAPIProvider` or `setCustomIconLoader` lands in
the same store `<TrustyIcon>` reads, and can make those offline too.

## Using an icon in a component

Write the raw name inline — `name="ph:x"`, `icon: 'ph:gear'`. No role map, no
aliases; swapping collection later is a find/replace. Then regenerate:

```sh
pnpm generate:icons
```

The generator scans every non-story, non-spec `src/**/*.{vue,ts}` for quoted
`collection:icon` literals whose collection is an `@iconify-json/<collection>`
devDependency, resolves each with `@iconify/utils`, and writes
`icons.generated.ts`. There is no list to keep: the scan is the list. A name the
collection doesn't have fails the run.

`icons.generated.ts` is **committed**, and nothing regenerates it automatically
— commit it with the component change, or the new icon is fetched online
instead of bundled. CI's `icons-generated` job fails the pipeline if the two
disagree.

Stories and specs are not scanned: they show consumer usage, and fetch like a
consumer's would.
