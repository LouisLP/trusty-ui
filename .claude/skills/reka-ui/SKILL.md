---
name: reka-ui
description: Find and read the Reka UI primitive under a Trusty UI component. Use before hand-rolling interaction, keyboard, or ARIA behaviour, when checking whether a headless primitive already exists for a component, or when looking up a primitive's parts, props, emits, or keyboard map.
---

# Reka UI

Every Trusty UI component that has behaviour sits on a [Reka UI](https://reka-ui.com)
headless primitive — 24 of them already do. Reka owns keyboard navigation, focus
management and trapping, ARIA wiring, and the controlled/uncontrolled `v-model`
split; a hand-rolled version of any of that is a regression, not a shortcut. So
the primitive gets checked **before** the component gets written.

## Two lookups

- **Does a primitive exist?** `ls node_modules/reka-ui/dist/` — 118 folders, one
  per primitive, at the exact version this repo installs. Authoritative, offline,
  and never a version behind the docs.
- **What is its API?** Fetch `https://reka-ui.com/docs/components/{kebab-name}.md`
  — the markdown source of the docs page, carrying the anatomy, every part's
  props and emits, and the keyboard table. `https://reka-ui.com/llms.txt` indexes
  the lot when a name won't guess.

The Reka name is not the Trusty name: `TrustySelect` wraps `Select*`,
`TrustyTextInput` wraps nothing at all. Search by *behaviour* — a disclosure, a
roving-focus list, a floating panel — not by the Trusty component's name.

## Using one

Import the **dedicated parts** by name and commit to the markup they emit:

```ts
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
```

`Primitive`, `as`, and `asChild` hand that commitment to the caller and take
semantics and a11y with it — the repo leaves all three out
([README](../../../README.md#the-rules)).

When no primitive matches, render the plain native element that already carries
the semantics (`<button>`, `<input>`, `<details>`) and give the interaction its
keyboard path by hand.
