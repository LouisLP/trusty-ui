import type { TagBaseColor } from '../../private/TagBase/TagBase.types'

/** Hue of a tag. Decorative — the app decides what a hue means. Backed by the extended palette in `styles/tokens/primitives.css`. The same seven hues `<TrustyFilterTag>` and `<TrustyTree>` paint. */
export type TrustyTagColor = TagBaseColor

/** What a tag lets you do to it, and so which glyph it shows. A tag never offers both. For switching a chip on and off, reach for `<TrustyFilterTag>` instead. */
export type TrustyTagAction = 'add' | 'remove'
