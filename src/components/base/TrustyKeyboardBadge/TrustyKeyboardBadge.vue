<script setup lang="ts">
import type { TrustyKeyboardKey } from './TrustyKeyboardBadge.keys'
import { computed } from 'vue'
import { keyGlyph } from './TrustyKeyboardBadge.keys'

const props = defineProps<{
  /** Keys of the shortcut, in press order. `mod` renders the platform's primary modifier (⌘ on Apple, Ctrl elsewhere), named special keys render their glyph (`['mod', 'shift', 'D']` → ⌘ ⇧ D), and text keys render literally. A closed set: extend `TrustyKeyboardKey` when a key is missing. Display-only — key handling stays with the consumer. */
  keys: TrustyKeyboardKey[]
}>()

const glyphs = computed(() => props.keys.map(key => keyGlyph(key)))
</script>

<template>
  <!-- Nested <kbd>: the outer one is the shortcut, each inner one an actual key to press — the semantic markup for key combinations. -->
  <kbd class="trusty-keyboard-badge">
    <kbd
      v-for="(glyph, index) in glyphs"
      :key="index"
      class="trusty-keyboard-badge-key"
      :data-single-char="[...glyph].length === 1 ? '' : undefined"
    >
      {{ glyph }}
    </kbd>
  </kbd>
</template>

<style scoped>
.trusty-keyboard-badge {
  display: inline-flex;
  gap: var(--space-2xs);
  align-items: center;
  font-family: var(--font-family-sans);
}

/* A key cap: fixed height, hugs wider text labels, and a thicker bottom border for the key-cap relief. Inter's Fontsource subsets carry no ⇧ or ⇪; the sans-serif fallback chain covers them. */
.trusty-keyboard-badge-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: var(--size-control-xs);
  block-size: var(--size-control-xs);
  padding-inline: var(--space-xs);
  font-family: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-text-toned);
  letter-spacing: var(--letter-spacing-wide);
  white-space: nowrap;
  background-color: var(--color-bg-elevated);
  border: var(--border-sm) solid var(--color-border-highlight);
  border-block-end-width: var(--border-md);
  border-radius: var(--radius-sm);
}

/* Single-character keys drop the inline padding and pin to the fixed width, so they sit as exact squares and save horizontal space in menus. */
.trusty-keyboard-badge-key[data-single-char] {
  inline-size: var(--size-control-xs);
  padding-inline: 0;
}
</style>
