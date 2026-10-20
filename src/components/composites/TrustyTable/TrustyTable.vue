<script setup lang="ts">
import type { TrustyTableColumn, TrustyTableRow, TrustyTableSort } from './TrustyTable.types'
import TrustyCheckbox from '../../base/TrustyCheckbox/TrustyCheckbox.vue'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'
import TrustyPagination from '../../base/TrustyPagination/TrustyPagination.vue'
import { useTableModel } from './useTableModel'

const props = withDefaults(defineProps<{
  /** The columns, left to right. */
  columns: TrustyTableColumn[]
  /** The rows of the page currently on screen. */
  rows: TrustyTableRow[]
  /** Names the table for screen readers, as a visually hidden `<caption>`. Optional, but worth setting when the surrounding page doesn't already say what the rows are. */
  label?: string
  /** Adds the leading checkbox column and the select-all box in the header. */
  selectable?: boolean
  /** Shown in place of the body when there are no rows. */
  emptyLabel?: string
  /** Rows in the whole collection, across every page. Setting it renders the footer — the status line, plus pagination once there is a second page. */
  total?: number
  /** Rows on one page. Drives both the pagination and the status line. */
  itemsPerPage?: number
}>(), {
  selectable: false,
  emptyLabel: 'No items yet',
  itemsPerPage: 10,
})

// The keys of the selected rows. The consumer owns the list, so selection can outlive a page change.
const selected = defineModel<(string | number)[]>('selected', { default: () => [] })

// The column and direction being sorted on, or undefined for unsorted. The table reports the intent and never reorders `rows` — sorting a page of a paged collection is the data source's job, not the view's.
const sort = defineModel<TrustyTableSort | undefined>('sort', { default: undefined })

// The current page, 1-based.
const page = defineModel<number>('page', { default: 1 })

// Every decision the table makes — selection, sorting, cell content, pagination — lives in useTableModel, which takes getters and refs rather than this component, so its rules are testable without a mount. What is left here is the markup.
const table = useTableModel({
  columns: () => props.columns,
  rows: () => props.rows,
  selectable: () => props.selectable,
  total: () => props.total,
  itemsPerPage: () => props.itemsPerPage,
  selected,
  sort,
  page,
})

const { isEmpty, showSelection, columnCount, selection, sorting, pagination, cellAt } = table
</script>

<template>
  <div class="trusty-table">
    <div class="trusty-table-scroll">
      <table class="trusty-table-grid">
        <caption
          v-if="label"
          class="trusty-table-caption"
        >
          {{ label }}
        </caption>

        <thead>
          <tr>
            <th
              v-if="showSelection"
              scope="col"
              class="trusty-table-head trusty-table-select"
              data-width="hug"
            >
              <TrustyCheckbox
                :model-value="selection.all.value"
                size="sm"
                aria-label="Select all rows"
                @update:model-value="selection.toggleAll"
              />
            </th>

            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="trusty-table-head"
              :data-width="column.width ?? 'fill'"
              :data-align="column.align ?? 'start'"
              :aria-sort="sorting.ariaFor(column)"
            >
              <button
                v-if="column.sortable"
                type="button"
                class="trusty-table-sort"
                :data-sorted="sort?.key === column.key || undefined"
                @click="sorting.toggle(column)"
              >
                {{ column.label }}
                <TrustyIcon
                  :name="sort?.key === column.key && sort.direction === 'desc' ? 'ph:arrow-up' : 'ph:arrow-down'"
                  class="trusty-table-sort-icon"
                />
              </button>
              <template v-else>
                {{ column.label }}
              </template>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="isEmpty">
            <td
              :colspan="columnCount"
              class="trusty-table-empty"
            >
              {{ emptyLabel }}
            </td>
          </tr>

          <tr
            v-for="row in rows"
            v-else
            :key="row.key"
            class="trusty-table-row"
            :data-selected="selection.has(row) || undefined"
            :data-disabled="row.disabled || undefined"
          >
            <td
              v-if="showSelection"
              class="trusty-table-cell trusty-table-select"
              data-width="hug"
            >
              <TrustyCheckbox
                :model-value="selection.has(row)"
                :disabled="row.disabled"
                size="sm"
                :aria-label="`Select row ${row.key}`"
                @update:model-value="checked => selection.toggle(row, checked)"
              />
            </td>

            <td
              v-for="column in columns"
              :key="column.key"
              class="trusty-table-cell"
              :data-width="column.width ?? 'fill'"
              :data-align="column.align ?? 'start'"
            >
              <!-- A per-column slot takes the cell over entirely — the escape hatch for action buttons, badges, and the like. -->
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="cellAt(row, column).value"
              >
                <span class="trusty-table-text">{{ cellAt(row, column).text }}</span>
                <span
                  v-if="cellAt(row, column).description"
                  class="trusty-table-description"
                >
                  {{ cellAt(row, column).description }}
                </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="pagination.showFooter.value"
      class="trusty-table-footer"
    >
      <p
        class="trusty-table-status"
        :data-selection="selected.length > 0 || undefined"
      >
        <template v-if="selected.length > 0">
          {{ selected.length }} of {{ total }} rows selected
        </template>
        <template v-else>
          Showing {{ pagination.range.value.start }}–{{ pagination.range.value.end }} of {{ total }}
        </template>
      </p>

      <TrustyPagination
        v-if="pagination.showPagination.value"
        v-model:page="page"
        :total="total ?? 0"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>

<style scoped>
.trusty-table {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-family-sans);
  color: var(--color-text);
  border-radius: var(--radius-sm);
}

/* A narrow container scrolls the grid rather than squashing the columns. */
.trusty-table-scroll {
  overflow-x: auto;
}

.trusty-table-grid {
  inline-size: 100%;

  /* Collapsed, so every row boundary is one shared border. That is what keeps two adjacent selected rows from stacking a rule each, and it means selection has a single border to recolour rather than two to reconcile. */
  border-collapse: collapse;
}

/* The accessible name, kept out of sight. */
.trusty-table-caption {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

.trusty-table-head {
  block-size: var(--size-control-md);
  padding: var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);

  letter-spacing: var(--letter-spacing-widest);

  /* `th` centres by default; the cells under it don't, so say it explicitly and let [data-align] below be the only thing that moves a column. */
  text-align: start;
  text-transform: uppercase;
  background-color: var(--color-bg-elevated);
  border-block-end: var(--border-sm) solid var(--color-border);
}

.trusty-table-cell {
  /* Rows sit at 48px but give way to 32px when a cell has one short line. */
  block-size: var(--size-control-xl);
  padding: var(--space-sm);
  font-size: var(--font-size-sm);

  /* The row divider. Selection recolours this exact border rather than adding one of its own, so no width ever changes and no row moves. It stays a real border because the browser snaps those to whole device pixels — rows are a fractional height, so a hairline painted any other way drops out of every other row. */
  border-block-end: var(--border-sm) solid var(--color-border);
}

/* `hug` shrinks to content — a 1px wish the layout rounds up to the minimum. */
.trusty-table-head[data-width='hug'],
.trusty-table-cell[data-width='hug'] {
  inline-size: 1px;
  white-space: nowrap;
}

.trusty-table-head[data-align='end'],
.trusty-table-cell[data-align='end'] {
  text-align: end;
}

.trusty-table-select {
  inline-size: 1px;
}

/* Text content: the value, with an optional quieter line under it. */
.trusty-table-text {
  display: block;
  overflow: hidden;
  line-height: var(--line-height-normal);
  text-overflow: ellipsis;
}

.trusty-table-description {
  display: block;
  overflow: hidden;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trusty-table-row:hover:not([data-disabled]) {
  background-color: var(--color-bg-elevated);
}

/* Selection lifts the row and rules it top and bottom in primary. Both rules are dividers that already exist — the row's own, and the one belonging to whatever sits above it — recoloured in place. Nothing is added and nothing resizes, so picking a row can't nudge the rows under it. */
.trusty-table-row[data-selected] {
  background-color: var(--color-bg-elevated);
}

.trusty-table-row[data-selected] .trusty-table-cell,
.trusty-table-row:has(+ .trusty-table-row[data-selected]) .trusty-table-cell {
  border-block-end-color: var(--color-primary);
}

/* Above the first row that divider belongs to the header. */
.trusty-table-grid:has(.trusty-table-row:first-child[data-selected]) .trusty-table-head {
  border-block-end-color: var(--color-primary);
}

.trusty-table-row[data-disabled] {
  color: var(--color-text-muted);
}

.trusty-table-row[data-disabled] .trusty-table-description {
  color: inherit;
}

/* Header sort control: the arrow shows on hover, focus, or while sorted. */
.trusty-table-sort {
  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  padding: 0;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  appearance: none;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: var(--radius-xs);
}

.trusty-table-sort-icon {
  font-size: var(--font-size-lg);
  visibility: hidden;
}

.trusty-table-sort:hover,
.trusty-table-sort:focus-visible {
  color: var(--color-text);
}

.trusty-table-sort:hover .trusty-table-sort-icon,
.trusty-table-sort:focus-visible .trusty-table-sort-icon,
.trusty-table-sort[data-sorted] .trusty-table-sort-icon {
  visibility: visible;
}

.trusty-table-sort[data-sorted] {
  color: var(--color-text);
}

.trusty-table-sort:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-table-sort:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Empty body: headers stay, the rows are replaced by one quiet line. */
.trusty-table-empty {
  block-size: var(--size-2xs);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);

  letter-spacing: var(--letter-spacing-widest);
  text-align: center;
  text-transform: uppercase;
}

.trusty-table-footer {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  background-color: var(--color-bg-elevated);
}

.trusty-table-status {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* An active selection is worth noticing, so the count reads in info blue. */
.trusty-table-status[data-selection] {
  color: var(--color-info-text);
}
</style>
