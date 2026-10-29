<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/tree
//
// Reka's Tree primitive has no drag-and-drop of its own — its own docs wire an external library around it. We use the browser's native drag-and-drop instead: it costs no dependency (see README, "Depend on nothing local"), autoscrolls long trees and paints the drag preview for free.

import type { TreeItemSelectEvent, TreeItemToggleEvent } from 'reka-ui'
import type { TrustyIconName } from '../../../icons'
import type { TrustyTreeDropPosition, TrustyTreeItem, TrustyTreeMove } from './TrustyTree.types'
import { TreeItem, TreeRoot } from 'reka-ui'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import { moveTreeItem, treeDropPosition, treeItemPath, treeItemSubtreeIds, treeMoveForKey } from './TrustyTree.move'

const props = withDefaults(defineProps<{
  /** Disable the whole tree */
  disabled?: boolean
  /** Let rows be dragged to a new place — with the pointer, or with Ctrl/⌘ + Shift + ↑↓←→ on the focused row. */
  draggable?: boolean
}>(), {
  disabled: false,
  draggable: false,
})

const emit = defineEmits<{
  /** A row was dropped somewhere new. Fires before `update:items`, and fires whether or not `v-model:items` is bound — bind this instead when the tree data lives somewhere the component cannot write to. */
  'move': [move: TrustyTreeMove]
  /**
   * A row was right-clicked. Carries the row, so a single surrounding `<TrustyContextMenu>` can build its items for whichever row was hit.
   *
   * Deliberately NOT named `contextmenu`: declaring a native event name as an emit stops Vue from passing a parent's `onContextmenu` through to the DOM, and the parent's handler would be called with these arguments instead — which is exactly how a wrapping menu trigger gets broken.
   */
  'row-contextmenu': [item: TrustyTreeItem, event: MouseEvent]
}>()

/** Root rows, nested through each item's `children`. Bind it with `v-model:items` and `draggable` reorders the tree for you; bind it as a plain prop and the reorder is yours to apply from the `move` event. */
const items = defineModel<TrustyTreeItem[]>('items', { required: true })
/** id of the selected row (click / Enter / Space; click again deselects) */
const model = defineModel<string>()
/** ids of the expanded parents */
const expanded = defineModel<string[]>('expanded', { default: () => [] })

// TreeRoot renders the <ul>; `$el` is how we reach it to put focus back
const root = useTemplateRef<{ $el?: HTMLElement }>('root')

const selectedPath = computed(() =>
  model.value === undefined ? undefined : treeItemPath(items.value, model.value))
const selectedItem = computed(() => selectedPath.value?.at(-1))

// The selection's group — its parent and siblings — reads as the active branch (the design's "highlighted" state). Root-level selections have no parent group, so nothing highlights.
const highlightedIds = computed<Set<string>>(() => {
  const parent = selectedPath.value?.at(-2)
  return new Set(parent?.children ? [parent.id, ...parent.children.map(c => c.id)] : [])
})

function iconFor(item: TrustyTreeItem, isExpanded: boolean): TrustyIconName | undefined {
  if (item.icon)
    return item.icon
  return item.children ? (isExpanded ? 'ph:folder-open' : 'ph:folder') : undefined
}

function isDisabled(item: TrustyTreeItem) {
  return props.disabled || item.disabled === true
}

function guardDisabled(item: TrustyTreeItem, event: TreeItemSelectEvent<TrustyTreeItem> | TreeItemToggleEvent<TrustyTreeItem>) {
  if (isDisabled(item))
    event.preventDefault()
}

/* ---------------------------------------------------------------- dragging */

const dragId = ref<string>()
const dropId = ref<string>()
const dropPosition = ref<TrustyTreeDropPosition>()

/** The dragged row and everything under it — none of it can receive the drop. */
const draggedIds = computed<Set<string>>(() => {
  const item = dragId.value === undefined ? undefined : treeItemPath(items.value, dragId.value)?.at(-1)
  return new Set(item ? treeItemSubtreeIds(item) : [])
})

function canDrag(item: TrustyTreeItem) {
  return props.draggable && !isDisabled(item)
}

function canDrop(item: TrustyTreeItem) {
  return canDrag(item) && dragId.value !== undefined && !draggedIds.value.has(item.id)
}

/** The row's measured box, which treeDropPosition turns into a position. */
function positionFor(item: TrustyTreeItem, event: DragEvent): TrustyTreeDropPosition {
  return treeDropPosition(item, (event.currentTarget as HTMLElement).getBoundingClientRect(), event.clientY)
}

/** `dragleave` bubbles from every row, and fires for row-to-row moves too, so only a leave that lands outside the tree entirely drops the indicator. */
function onRootDragLeave(event: DragEvent) {
  const root = event.currentTarget as HTMLElement
  const to = event.relatedTarget
  if (!(to instanceof Node) || !root.contains(to))
    dropId.value = undefined
}

function clearDrag() {
  dragId.value = undefined
  dropId.value = undefined
  dropPosition.value = undefined
}

function onDragStart(item: TrustyTreeItem, event: DragEvent) {
  if (!canDrag(item)) {
    event.preventDefault()
    return
  }
  dragId.value = item.id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // some browsers refuse to start a drag without any payload
    event.dataTransfer.setData('text/plain', item.id)
  }
}

function onDragOver(item: TrustyTreeItem, event: DragEvent) {
  if (!canDrop(item))
    return
  // preventDefault is what marks this row as a valid drop target
  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'move'
  dropId.value = item.id
  dropPosition.value = positionFor(item, event)
}

function onDrop(item: TrustyTreeItem, event: DragEvent) {
  if (!canDrop(item))
    return
  event.preventDefault()
  applyMove({ id: dragId.value!, targetId: item.id, position: positionFor(item, event) })
  clearDrag()
}

/** Report the move, apply it to `v-model:items`, and keep the row in view. */
function applyMove(move: TrustyTreeMove) {
  emit('move', move)
  if (move.position === 'inside' && !expanded.value.includes(move.targetId))
    expanded.value = [...expanded.value, move.targetId]
  items.value = moveTreeItem(items.value, move)
}

/* -------------------------------------------------- moving with a keyboard */

/** Ctrl/⌘ + Shift + arrow moves the focused row. Which move that is — and whether there is one at all at the edges of the tree — is treeMoveForKey's decision. Reka's own roving focus ignores modified arrows, so it never competes for these. */
function onKeydown(item: TrustyTreeItem, event: KeyboardEvent) {
  if (!canDrag(item) || !event.shiftKey || !(event.ctrlKey || event.metaKey))
    return

  const move = treeMoveForKey(event.key, items.value, item.id)
  if (!move)
    return
  event.preventDefault()
  applyMove(move)
  refocus(item.id)
}

/** The rows re-key as the tree changes shape, so put focus back by id. */
async function refocus(id: string) {
  await nextTick()
  const el = root.value?.$el as HTMLElement | undefined
  const row = [...el?.querySelectorAll<HTMLElement>('[data-id]') ?? []]
    .find(candidate => candidate.dataset.id === id)
  row?.focus()
}
</script>

<template>
  <TreeRoot
    ref="root"
    v-slot="{ flattenItems }"
    v-model:expanded="expanded"
    :items="items"
    :get-key="(item: TrustyTreeItem) => item.id"
    :get-children="(item: TrustyTreeItem) => item.children"
    :model-value="selectedItem"
    :disabled="disabled"
    class="trusty-tree"
    @update:model-value="model = ($event as TrustyTreeItem | undefined)?.id"
    @dragleave="onRootDragLeave"
  >
    <TreeItem
      v-for="item in flattenItems"
      :key="item._id"
      v-slot="{ isExpanded }"
      v-bind="item.bind"
      class="trusty-tree-node"
      :data-id="item.value.id"
      :disabled="isDisabled(item.value)"
      :data-leaf="item.hasChildren ? undefined : ''"
      :data-highlighted="highlightedIds.has(item.value.id) ? '' : undefined"
      :draggable="canDrag(item.value)"
      :data-dragging="dragId === item.value.id ? '' : undefined"
      :data-drop="dropId === item.value.id ? dropPosition : undefined"
      @select="guardDisabled(item.value, $event)"
      @toggle="guardDisabled(item.value, $event)"
      @keydown="onKeydown(item.value, $event)"
      @dragstart="onDragStart(item.value, $event)"
      @dragover="onDragOver(item.value, $event)"
      @drop="onDrop(item.value, $event)"
      @dragend="clearDrag"
      @contextmenu="emit('row-contextmenu', item.value, $event)"
    >
      <!-- One guide segment per ancestor level; rows stack flush, so the segments read as continuous indent lines down each branch. -->
      <span
        v-for="depth in item.level - 1"
        :key="depth"
        class="trusty-tree-guide"
        aria-hidden="true"
      />
      <!-- leaf icons sit in the design's mint chip; parent icons are bare -->
      <span
        v-if="!item.hasChildren && item.value.icon"
        class="trusty-tree-chip"
      >
        <TrustyIcon :name="item.value.icon" />
      </span>
      <TrustyIcon
        v-else-if="iconFor(item.value, isExpanded)"
        :name="iconFor(item.value, isExpanded)!"
        class="trusty-tree-icon"
      />
      <span class="trusty-tree-label">{{ item.value.label }}</span>
      <!-- decorative color tags, right-aligned by the stretching label -->
      <span
        v-if="item.value.tags?.length"
        class="trusty-tree-tags"
        aria-hidden="true"
      >
        <span
          v-for="(tag, index) in item.value.tags"
          :key="index"
          class="trusty-tree-tag"
          :data-color="tag"
        />
      </span>
    </TreeItem>
  </TreeRoot>
</template>

<style scoped>
.trusty-tree {
  --trusty-tree-chip-bg: var(--color-tag-mint-strong);

  /* Tag hues — the --color-tag-* roles in tokens/semantic.css. */
  --trusty-tree-tag-blue: color-mix(in oklab, var(--color-tag-blue) 40%, transparent);
  --trusty-tree-tag-stone: color-mix(in oklab, var(--color-tag-stone) 40%, transparent);
  --trusty-tree-tag-purple: color-mix(in oklab, var(--color-tag-purple) 40%, transparent);
  --trusty-tree-tag-forest: color-mix(in oklab, var(--color-tag-forest) 40%, transparent);
  --trusty-tree-tag-mint: color-mix(in oklab, var(--color-tag-mint) 40%, transparent);
  --trusty-tree-tag-magenta: color-mix(in oklab, var(--color-tag-magenta) 40%, transparent);
  --trusty-tree-tag-brown: color-mix(in oklab, var(--color-tag-brown) 40%, transparent);

  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  font-family: var(--font-family-sans);
  list-style: none;
}

.trusty-tree-node {
  position: relative;
  display: flex;
  align-items: center;
  block-size: var(--size-control-sm);

  /* inline-only: the guides must stretch the full row so the indent lines of stacked rows connect into one continuous line per branch */
  padding-inline: var(--space-xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color var(--duration-fast) ease-out;
}

/* leaves (rows without children) read stronger than their parent folders */
.trusty-tree-node[data-leaf] {
  color: var(--color-text);
}

/* the selection's group — parent + siblings — recedes into an inset as the active branch, below the selected row's lift */
.trusty-tree-node[data-highlighted] {
  background-color: var(--color-bg-inset);
}

/* stylelint-disable-next-line a11y/selector-pseudo-class-focus -- keyboard
   focus gets an equivalent ring from the :focus rule below */
.trusty-tree-node:hover:not([data-disabled]) {
  background-color: var(--color-bg-elevated);
}

/* inset ring instead of a border so the fixed 24px row never reflows */
.trusty-tree-node[data-selected] {
  background-color: var(--color-bg-elevated);
  box-shadow: inset 0 0 0 var(--border-md) var(--color-primary-highlight);
}

/* Authored on :focus so the a11y linter sees it paired with :hover, then hidden for pointer focus — only keyboard users get the ring. Drawn inward so adjacent flush rows don't clip it. */
.trusty-tree-node:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: calc(-1 * var(--border-md));
}

.trusty-tree-node:focus:not(:focus-visible) {
  outline-color: transparent;
}

.trusty-tree-node[data-disabled] {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.trusty-tree-node[draggable='true'] {
  cursor: grab;
}

/* the row being dragged stays in place, faded, as its own drag preview moves */
.trusty-tree-node[data-dragging] {
  opacity: 0.4;
  cursor: grabbing;
}

/* Drop feedback. before/after draw a line on the row's edge from a pseudo element, so they never fight the inset ring [data-selected] draws. */
.trusty-tree-node[data-drop='before']::after,
.trusty-tree-node[data-drop='after']::after {
  position: absolute;
  inset-inline: 0;
  block-size: var(--border-md);
  content: '';
  background-color: var(--color-primary-highlight);
}

.trusty-tree-node[data-drop='before']::after {
  inset-block-start: 0;
}

.trusty-tree-node[data-drop='after']::after {
  inset-block-end: 0;
}

/* nesting targets the whole row, so it tints rather than drawing an edge */
.trusty-tree-node[data-drop='inside'] {
  background-color: var(--color-bg-inset-muted);
  box-shadow: inset 0 0 0 var(--border-md) var(--color-primary-highlight);
}

.trusty-tree-guide {
  flex: none;
  align-self: stretch;
  inline-size: var(--space-sm);
  border-inline-start: var(--border-sm) solid var(--color-border);
}

/* leaf icons sit in a fixed chip */
.trusty-tree-chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--size-control-xs);
  block-size: var(--size-control-xs);
  font-size: var(--font-size-md);
  background-color: var(--trusty-tree-chip-bg);
  border-radius: var(--radius-xs);
}

.trusty-tree-icon {
  /* stylelint-disable-next-line declaration-property-value-allowed-list --
     TrustyIcon sizes itself at 1em, so font-size is its sizing knob; the design wants 18px icons (size-control-xs), which has no font token */
  font-size: var(--size-control-xs);
}

/* stretches to push the tags to the row's end; min-inline-size lets it shrink past its text so the ellipsis kicks in */
.trusty-tree-label {
  flex: 1 0 0;
  min-inline-size: 0;
  margin-inline-start: var(--space-xs);
  overflow: hidden;
  text-overflow: ellipsis;
}

.trusty-tree-tags {
  display: inline-flex;
  flex: none;
  gap: var(--space-2xs);
  align-items: center;
  margin-inline-start: var(--space-xs);
}

.trusty-tree-tag {
  inline-size: var(--space-sm);
  block-size: var(--space-sm);
  border-radius: var(--radius-xs);
}

.trusty-tree-tag[data-color='blue'] {
  background-color: var(--trusty-tree-tag-blue);
}

.trusty-tree-tag[data-color='purple'] {
  background-color: var(--trusty-tree-tag-purple);
}

.trusty-tree-tag[data-color='forest'] {
  background-color: var(--trusty-tree-tag-forest);
}

.trusty-tree-tag[data-color='mint'] {
  background-color: var(--trusty-tree-tag-mint);
}

.trusty-tree-tag[data-color='magenta'] {
  background-color: var(--trusty-tree-tag-magenta);
}

.trusty-tree-tag[data-color='stone'] {
  background-color: var(--trusty-tree-tag-stone);
}

.trusty-tree-tag[data-color='brown'] {
  background-color: var(--trusty-tree-tag-brown);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-tree-node {
    transition: none;
  }
}
</style>
