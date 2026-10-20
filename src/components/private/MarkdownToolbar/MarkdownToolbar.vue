<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/toolbar

import type { TrustyMenuItem } from '../../composites/menu-items'
import type { MarkdownToolbarAction, MarkdownToolbarGroup, MarkdownToolbarItem } from './MarkdownToolbar.actions'
import {
  ToolbarButton,
  ToolbarRoot,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from 'reka-ui'
import { computed, ref, useTemplateRef } from 'vue'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'
import { keyGlyph } from '../../base/TrustyKeyboardBadge/TrustyKeyboardBadge.keys'
import TrustyPopover from '../../base/TrustyPopover/TrustyPopover.vue'
import TrustyTextInput from '../../base/TrustyTextInput/TrustyTextInput.vue'
import TrustyTooltip from '../../base/TrustyTooltip/TrustyTooltip.vue'
import TrustyDropdownMenu from '../../composites/TrustyDropdownMenu/TrustyDropdownMenu.vue'
import { ariaKeyShortcuts, MARKDOWN_TOOLBAR_LINK } from './MarkdownToolbar.actions'
import { useToolbarCollapse } from './useToolbarCollapse'

const props = withDefaults(defineProps<{
  /** Which formats apply where the caret sits, shown as pressed segments. The bar tracks nothing itself — the editor owns this, and a press that the editor does not honour leaves the segment where it was. */
  active?: MarkdownToolbarAction[]
  /** Disable every action at once. */
  disabled?: boolean
  /** Disable just the link action. Linking needs something to link, so the editor turns this on while the selection is empty. */
  linkDisabled?: boolean
}>(), {
  active: () => [],
  disabled: false,
  linkDisabled: false,
})

const emit = defineEmits<{
  /** An action was pressed. What it *means* is the editing surface's to decide. */
  select: [action: MarkdownToolbarAction]
  /** The link popover was confirmed with a non-empty URL. */
  link: [url: string]
}>()

const linkOpen = ref(false)
const linkUrl = ref('')

/** The group's slice of `active`, in the shape Reka wants for its `type`. */
function groupValue(group: MarkdownToolbarGroup): string | string[] {
  const pressed = group.items
    .map(item => item.action)
    .filter(action => props.active.includes(action))

  return group.exclusive ? (pressed[0] ?? '') : pressed
}

/** Reka reports the group's next value, not which segment was hit, so the one action that moved is the difference between the two sets. Turning a segment off is still a press — the editor toggles the format either way. */
function onGroupUpdate(group: MarkdownToolbarGroup, next: unknown) {
  // Reka types the payload as its own AcceptableValue; the values it can hand back here are only ever this group's action strings.
  const before = new Set(([] as string[]).concat(groupValue(group)).filter(Boolean))
  const after = new Set(
    (Array.isArray(next) ? next : [next]).filter((value): value is string => Boolean(value)),
  )
  const changed = [...after].find(value => !before.has(value))
    ?? [...before].find(value => !after.has(value))

  if (changed)
    emit('select', changed as MarkdownToolbarAction)
}

/** What a button's tooltip reads, e.g. "Bold (⌘+B)". The glyphs are the ones TrustyKeyboardBadge draws on the overflow rows, so a segment and its folded-away twin name the same keys. */
function tooltip(item: MarkdownToolbarItem): string {
  return `${item.label} (${item.shortcut.map(key => keyGlyph(key)).join('+')})`
}

/** What a button announces as its shortcut, e.g. "Control+Shift+X". */
function keyshortcuts(item: MarkdownToolbarItem): string {
  return ariaKeyShortcuts(item.shortcut)
}

// How many groups have folded into the overflow menu. The bar is block-level, so its width comes from its parent rather than from its own contents, and observing it cannot feed back into what it measures.
const root = useTemplateRef<{ $el?: HTMLElement }>('root')

// Measuring, thresholds, and which groups that leaves on the bar — one call.
const { level: collapseLevel, visible: shownGroups, collapsed: foldedGroups } = useToolbarCollapse({
  element: () => root.value?.$el,
})

/** The folded groups as menu rows. No pressed state: `TrustyMenuItem` has no checked variant, so a folded-away Quote reads as an action to take rather than as a format that is currently on. */
const overflowItems = computed<TrustyMenuItem[]>(() =>
  foldedGroups.value.flatMap((group, index) => [
    ...(index > 0 ? [{ type: 'separator' } as const] : []),
    { type: 'label' as const, label: group.name },
    ...group.items.map(item => ({
      value: item.action,
      label: item.label,
      icon: item.icon,
      shortcut: item.shortcut,
    })),
  ]),
)

function applyLink() {
  const url = linkUrl.value.trim()
  if (!url)
    return

  emit('link', url)
  linkUrl.value = ''
  linkOpen.value = false
}
</script>

<template>
  <ToolbarRoot
    ref="root"
    :loop="true"
    aria-label="Formatting"
    class="markdown-toolbar"
  >
    <template
      v-for="(group, index) in shownGroups"
      :key="group.name"
    >
      <ToolbarSeparator
        v-if="index > 0"
        class="markdown-toolbar-separator"
      />

      <ToolbarToggleGroup
        :type="group.exclusive ? 'single' : 'multiple'"
        :model-value="groupValue(group)"
        :disabled="disabled"
        :aria-label="group.name"
        :data-toolbar-group="group.name"
        class="markdown-toolbar-group"
        @update:model-value="value => onGroupUpdate(group, value)"
      >
        <TrustyTooltip
          v-for="item in group.items"
          :key="item.action"
          :text="tooltip(item)"
          :disabled="disabled"
        >
          <ToolbarToggleItem
            :value="item.action"
            :aria-label="item.label"
            :aria-keyshortcuts="keyshortcuts(item)"
            class="markdown-toolbar-item"
          >
            <TrustyIcon
              :name="item.icon"
              size="sm"
            />
          </ToolbarToggleItem>
        </TrustyTooltip>
      </ToolbarToggleGroup>

      <!-- The link sits flush against the emphasis run, sharing its collapsed border, but it is not a toggle: it opens a panel and nothing is "on" afterwards. -->
      <TrustyPopover
        v-if="group.name === 'Emphasis'"
        v-model="linkOpen"
        side="bottom"
        alignment="start"
      >
        <template #trigger>
          <TrustyTooltip
            :text="tooltip(MARKDOWN_TOOLBAR_LINK)"
            :disabled="disabled || linkDisabled"
          >
            <ToolbarButton
              :disabled="disabled || linkDisabled || undefined"
              :aria-label="MARKDOWN_TOOLBAR_LINK.label"
              :aria-keyshortcuts="keyshortcuts(MARKDOWN_TOOLBAR_LINK)"
              class="markdown-toolbar-item markdown-toolbar-link-trigger"
            >
              <TrustyIcon
                :name="MARKDOWN_TOOLBAR_LINK.icon"
                size="sm"
              />
            </ToolbarButton>
          </TrustyTooltip>
        </template>

        <form
          class="markdown-toolbar-link-form"
          novalidate
          @submit.prevent="applyLink"
        >
          <TrustyTextInput
            v-model="linkUrl"
            type="url"
            placeholder="Enter link URL"
            aria-label="Link URL"
          />
        </form>
      </TrustyPopover>
    </template>

    <!-- Only present once something has folded, so the bar at full width is exactly what the design draws. -->
    <TrustyDropdownMenu
      v-if="collapseLevel > 0"
      :items="overflowItems"
      :disabled="disabled"
      @select="value => emit('select', value as MarkdownToolbarAction)"
    >
      <TrustyTooltip
        text="More formatting"
        :disabled="disabled"
      >
        <ToolbarButton
          :disabled="disabled || undefined"
          aria-label="More formatting"
          class="markdown-toolbar-item"
        >
          <TrustyIcon
            name="ph:dots-three"
            size="sm"
          />
        </ToolbarButton>
      </TrustyTooltip>
    </TrustyDropdownMenu>
  </ToolbarRoot>
</template>

<style scoped>
/* Top corners only: the bar is the textarea's chrome and sits flush on top of it, so rounding the bottom would cut a notch between the two. */
.markdown-toolbar {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  block-size: var(--space-xl);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  background-color: var(--color-bg-accented);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.markdown-toolbar-group {
  display: inline-flex;
  align-items: center;

  /* new stacking context so the segments' overlap and focus rings layer against each other, not against the surrounding page */
  isolation: isolate;
}

/* One segment. Square, 24px, and border-coloured the same as the bar it sits on — the border only reads once hover or a pressed fill lights it. */
.markdown-toolbar :deep(.markdown-toolbar-item) {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  block-size: var(--size-control-sm);
  padding: 0;
  color: var(--color-text);
  appearance: none;
  cursor: pointer;
  user-select: none;
  background-color: var(--color-bg-accented);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-md);
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out;
}

/* Overlap adjacent borders so neighbouring 2px edges collapse into one. */
.markdown-toolbar :deep(.markdown-toolbar-group > :not(:last-child) .markdown-toolbar-item),
.markdown-toolbar :deep(.markdown-toolbar-group > .markdown-toolbar-item:not(:last-child)) {
  margin-inline-end: calc(-1 * var(--border-md));
}

/* The link joins the emphasis run rather than starting a new one: cancel the bar's own gap as well as the border, or the two sit 2px apart. */
.markdown-toolbar :deep(.markdown-toolbar-link-trigger) {
  margin-inline-start: calc(-1 * (var(--space-xs) + var(--border-md)));
}

.markdown-toolbar :deep(.markdown-toolbar-item:hover:not(:disabled)),
.markdown-toolbar :deep(.markdown-toolbar-item[aria-pressed='true']),
.markdown-toolbar :deep(.markdown-toolbar-item:focus:not(:disabled)) {
  /* stylelint-disable-next-line scale-unlimited/declaration-strict-value --
     local in-component stacking, kept below the global --layer-* scale */
  z-index: 1;
}

/* Pressed = the format applies where the caret is. Keyed on aria-pressed, not Reka's data-state: the tooltip wrapping each segment owns data-state for its own open/closed and overwrites the toggle's. */
.markdown-toolbar :deep(.markdown-toolbar-item[aria-pressed='true']) {
  background-color: var(--color-text-muted);
}

/* The design's translucent chip (40% text-muted) resolved as a solid over the accented base, matching TrustyToggleGroup. */
/* stylelint-disable-next-line a11y/selector-pseudo-class-focus -- keyboard
   focus gets an equivalent ring from the :focus rule below */
.markdown-toolbar :deep(.markdown-toolbar-item:hover:not(:disabled)) {
  background-color: color-mix(in srgb, var(--color-text-muted) 40%, var(--color-bg-accented));
}

/* Authored on :focus so the a11y linter sees it paired with :hover, then hidden for pointer focus — only keyboard users get the ring. */
.markdown-toolbar :deep(.markdown-toolbar-item:focus:not(:disabled)) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.markdown-toolbar :deep(.markdown-toolbar-item:focus:not(:focus-visible)) {
  outline-color: transparent;
}

.markdown-toolbar :deep(.markdown-toolbar-item:disabled) {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* Disabled and pressed: the pressed fill is the same colour the icon dims to, which would swallow the glyph whole. Drop the fill and carry the pressed state on a border in the icon's own colour, so a disabled bar still shows which formats are on. */
.markdown-toolbar :deep(.markdown-toolbar-item[aria-pressed='true']:disabled) {
  background-color: var(--color-bg-accented);
  border-color: var(--color-text-muted);
}

/* --color-border is the bar's own fill, so the rule needs the lighter edge to be visible at all. */
.markdown-toolbar-separator {
  flex: none;
  inline-size: var(--border-sm);
  block-size: var(--size-control-sm);
  margin-inline: var(--space-2xs);
  background-color: var(--color-border-highlight);
}

.markdown-toolbar-link-form {
  inline-size: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .markdown-toolbar :deep(.markdown-toolbar-item) {
    transition: none;
  }
}
</style>
