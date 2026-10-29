<script setup lang="ts">
// PRIVATE primitive — NOT exported from the library. Owns the tag chip itself: the <button>, the seven hues, the surface / hover / ring / focus / disabled states and the ellipsised label, plus `#leading` / `#trailing` slots for whichever glyph the wrapper wants. TrustyTag (add / remove) and TrustyFilterTag (a toggle) skin it, and neither restates a colour.
//
// No Reka primitive under this: Reka's `Toggle` would own the pressed state for TrustyFilterTag but renders its own root, so TrustyTag — which is not a toggle at all — could not share this shell. `aria-pressed` is a prop here instead, and the one wrapper that toggles owns its own model.

import type { TagBaseProps } from './TagBase.types'

// $attrs lands last on the <button>, so a wrapper's (or a consumer's) aria-label wins.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<TagBaseProps & {
  /** `aria-pressed`, verbatim: `true` / `false` make the chip a toggle and paint the ring when on, `undefined` leaves it a plain button. */
  pressed?: boolean
}>(), {
  color: 'mint',
  disabled: false,
  pressed: undefined,
})

// Declared, not left to fall through: an undeclared event never reaches autodocs.
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    class="tag-base"
    :data-color="color"
    :disabled="disabled || undefined"
    :aria-pressed="pressed"
    v-bind="$attrs"
    @click="emit('click', $event)"
  >
    <slot name="leading" />
    <span class="tag-base-label">{{ label }}</span>
    <slot name="trailing" />
  </button>
</template>

<style scoped>
.tag-base {
  --tag-base-hue: var(--color-tag-blue);
  --tag-base-text: var(--color-text-toned);
  --tag-base-ring: var(--tag-base-hue);
  --tag-base-surface: color-mix(in oklab, var(--tag-base-hue) 24%, transparent);
  --tag-base-surface-hover: color-mix(in oklab, var(--tag-base-hue) 40%, transparent);

  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: var(--size-control-sm);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--tag-base-text);
  cursor: pointer;
  background-color: var(--tag-base-surface);
  border: none;
  border-radius: var(--radius-sm);
  transition:
    background-color var(--duration-fast) ease-out,
    box-shadow var(--duration-fast) ease-out;
}

.tag-base:hover:not(:disabled) {
  background-color: var(--tag-base-surface-hover);
}

/* Inset shadow, not a border: a border would grow the chip or squeeze its padding as the toggle flips, and it leaves `outline` free for the focus ring. */
.tag-base[aria-pressed='true'] {
  box-shadow: inset 0 0 0 var(--border-md) var(--tag-base-ring);
}

/* Authored on :focus so the a11y linter sees it paired with :hover, then hidden for pointer focus. */
.tag-base:focus:not(:disabled) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.tag-base:focus:not(:focus-visible) {
  outline-color: transparent;
}

.tag-base:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* ── hues ── */
.tag-base[data-color='stone'] {
  --tag-base-hue: var(--color-tag-stone);
  --tag-base-text: var(--color-tag-stone-text);
}

.tag-base[data-color='purple'] {
  --tag-base-hue: var(--color-tag-purple);
  --tag-base-text: var(--color-tag-purple-text);
}

.tag-base[data-color='forest'] {
  --tag-base-hue: var(--color-tag-forest);
  --tag-base-text: var(--color-tag-forest-text);
}

.tag-base[data-color='mint'] {
  --tag-base-hue: var(--color-tag-mint);
  --tag-base-text: var(--color-tag-mint-text);
}

/* Magenta is the one hue whose ring is not its own step. */
.tag-base[data-color='magenta'] {
  --tag-base-hue: var(--color-tag-magenta);
  --tag-base-text: var(--color-tag-magenta-text);
  --tag-base-ring: var(--color-tag-magenta-ring);
}

.tag-base[data-color='brown'] {
  --tag-base-hue: var(--color-tag-brown);
  --tag-base-text: var(--color-tag-brown-text);
}

.tag-base-label {
  /* clip the inline axis only: the ellipsis still works, and descenders that hang below a tight line box (line-height 1 on the button) are not cut off */
  overflow-x: clip;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .tag-base {
    transition: none;
  }
}
</style>
