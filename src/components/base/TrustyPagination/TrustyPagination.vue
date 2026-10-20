<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/pagination

import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

withDefaults(defineProps<{
  /** Total number of items being paged through — not the number of pages. */
  total: number
  /** Items on one page; with `total` it decides how many pages there are. */
  itemsPerPage?: number
  /** Page buttons either side of the current one. Ellipses cover the rest. */
  siblingCount?: number
  /** Pin the first and last page, and add the jump-to-end arrows. */
  showEdges?: boolean
  disabled?: boolean
}>(), {
  itemsPerPage: 10,
  siblingCount: 1,
  showEdges: true,
  disabled: false,
})

// The current page, 1-based. Uncontrolled, it starts at page 1.
const page = defineModel<number>('page', { default: 1 })
</script>

<template>
  <PaginationRoot
    v-model:page="page"
    :total="total"
    :items-per-page="itemsPerPage"
    :sibling-count="siblingCount"
    :show-edges="showEdges"
    :disabled="disabled"
    class="trusty-pagination"
  >
    <PaginationFirst
      v-if="showEdges"
      class="trusty-pagination-button"
    >
      <TrustyIcon name="ph:caret-double-left" />
    </PaginationFirst>

    <PaginationPrev class="trusty-pagination-button">
      <TrustyIcon name="ph:caret-left" />
    </PaginationPrev>

    <PaginationList
      v-slot="{ items }"
      class="trusty-pagination-list"
    >
      <template
        v-for="(item, index) in items"
        :key="item.type === 'page' ? `page-${item.value}` : `ellipsis-${index}`"
      >
        <PaginationListItem
          v-if="item.type === 'page'"
          :value="item.value"
          class="trusty-pagination-button trusty-pagination-page"
        >
          {{ item.value }}
        </PaginationListItem>
        <PaginationEllipsis
          v-else
          class="trusty-pagination-button trusty-pagination-ellipsis"
        >
          <TrustyIcon
            name="ph:dots-three"
            aria-hidden="true"
          />
        </PaginationEllipsis>
      </template>
    </PaginationList>

    <PaginationNext class="trusty-pagination-button">
      <TrustyIcon name="ph:caret-right" />
    </PaginationNext>

    <PaginationLast
      v-if="showEdges"
      class="trusty-pagination-button"
    >
      <TrustyIcon name="ph:caret-double-right" />
    </PaginationLast>
  </PaginationRoot>
</template>

<style scoped>
.trusty-pagination {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  font-family: var(--font-family-sans);
}

.trusty-pagination-list {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
}

/* Every control in the strip is the same 24px square; the page buttons below relax the inline size so multi-digit numbers still fit. */
.trusty-pagination-button {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-inline-size: var(--size-control-sm);
  block-size: var(--size-control-sm);
  padding: var(--space-2xs);
  font-family: inherit;
  font-size: var(--font-size-lg);
  color: var(--color-text);
  appearance: none;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-xs);
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out;
}

/* Numbers read as a label, not as an icon: 12px bold, tracked out. */
.trusty-pagination-page {
  padding-inline: var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

/* Faint primary wash on hover / press — the ghost button's channel. */
.trusty-pagination-button:hover:not(:disabled, .trusty-pagination-ellipsis) {
  background-color: var(--color-ghost-surface-subtle);
}

.trusty-pagination-button:active:not(:disabled, .trusty-pagination-ellipsis) {
  color: var(--color-primary-highlight);
}

/* The current page holds a solid fill instead of the hover wash. */
.trusty-pagination-page[data-selected] {
  background-color: var(--color-secondary);
}

.trusty-pagination-button:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-pagination-button:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* At either end the edge arrows go dead — colour carries it, not opacity. */
.trusty-pagination-button:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* The gap marker is decoration, not a target. */
.trusty-pagination-ellipsis {
  color: var(--color-text-muted);
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-pagination-button {
    transition: none;
  }
}
</style>
