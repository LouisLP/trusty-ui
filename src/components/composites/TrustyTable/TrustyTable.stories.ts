import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { TrustyTableCell, TrustyTableColumn, TrustyTableRow, TrustyTableSort } from './TrustyTable.types'
import { computed, ref } from 'vue'
import TrustyButton from '../../base/TrustyButton/TrustyButton.vue'
import TrustyTable from './TrustyTable.vue'

const columns: TrustyTableColumn[] = [
  { key: 'operation', label: 'Operation', sortable: true },
  { key: 'entity', label: 'Entity', sortable: true },
  { key: 'actions', label: 'Actions', width: 'hug', align: 'end' },
]

const rows: TrustyTableRow[] = [
  { key: 1, cells: { operation: { text: 'Delete', description: '20 sec ago' }, entity: { text: 'B-roll 014', description: 'Clips' } } },
  { key: 2, cells: { operation: { text: 'Add', description: '1 min ago' }, entity: { text: 'Marker 002', description: 'Markers' } } },
  { key: 3, cells: { operation: { text: 'Add', description: '1 min ago' }, entity: { text: 'Title card', description: 'Short film edit' } } },
  { key: 4, cells: { operation: { text: 'Add', description: '25.09.2025 12:20:01' }, entity: { text: 'Proxy', description: 'Short film edit' } } },
  { key: 5, cells: { operation: { text: 'Modify', description: '25.09.2025 12:20:01' }, entity: { text: 'Short film edit', description: 'Timelines' } } },
  { key: 6, disabled: true, cells: { operation: { text: 'Add', description: '25.09.2025 12:20:01' }, entity: { text: 'Name', description: 'Timelines' } } },
]

// The Actions column's cells, filled through its `cell-actions` slot.
const actionsSlot = `
  <template #cell-actions>
    <TrustyButton variant="ghost" icon="ph:info" aria-label="Details" />
  </template>
`

function cellText(cell: TrustyTableCell | undefined) {
  return cell === undefined ? '' : String(typeof cell === 'object' ? cell.text : cell)
}

/** What a consuming app does with `v-model:sort`. The table reports the column and direction and reorders nothing itself, so the story has to sort — which is the whole point of the contract, and the only way this demo moves. */
function sortRows(rows: TrustyTableRow[], sort: TrustyTableSort | undefined) {
  if (!sort)
    return rows

  const direction = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) =>
    direction * cellText(a.cells[sort.key]).localeCompare(cellText(b.cells[sort.key])))
}

const meta = {
  title: 'Data Display/TrustyTable',
  component: TrustyTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Rows and columns as a real HTML table, so a screen reader announces the grid and the headers that name each cell. Columns are declared once and every row supplies its cells by key; a cell is text, text with a quieter second line, or whatever a 'cell-<key>' slot renders. It optionally carries row selection, sortable headers, and a footer housing TrustyPagination and a status line.

The table shows the data it is given and never reorders or slices it — sorting and paging are reported through v-model so the data source can apply them, which is what lets the same component page through 10 rows or 10,000.

**Use it when**
- records share a set of fields and the user compares them across rows.

**Don't use it for**
- laying a page out in rows and columns: that is CSS grid's job, not a table's
- hierarchical or nested records: use TrustyTree
- a list of one field per record: use TrustyTree, or plain markup
- picking one value from many: use TrustySelect
`,
      },
    },
  },
  argTypes: {
    total: { control: { type: 'number', min: 0 } },
    itemsPerPage: { control: { type: 'number', min: 1 } },
  },
  args: {
    columns,
    rows,
    label: 'Change history',
    selectable: false,
    emptyLabel: 'No items yet',
    itemsPerPage: 6,
  },
  render: args => ({
    components: { TrustyButton, TrustyTable },
    setup: () => ({ args }),
    template: `<TrustyTable v-bind="args">${actionsSlot}</TrustyTable>`,
  }),
} satisfies Meta<typeof TrustyTable>

export default meta
type Story = StoryObj<typeof meta>

/** Columns, rows, and one slot-filled Actions column. No footer without a `total`. */
export const Default: Story = {}

/** `total` brings the footer: the status line, and pagination past page one. Live — the page drives which slice of the collection is handed to `rows`, exactly as a consuming app would. */
export const Paginated: Story = {
  args: { total: 24, itemsPerPage: 6 },
  render: args => ({
    components: { TrustyButton, TrustyTable },
    setup() {
      const page = ref(1)
      // Four pages of rows, keyed apart so Vue can tell them from each other.
      const all = Array.from({ length: 24 }, (_, i) => ({
        ...rows[i % rows.length]!,
        key: i + 1,
      }))
      const slice = computed(() =>
        all.slice((page.value - 1) * args.itemsPerPage!, page.value * args.itemsPerPage!))

      return { args, page, slice }
    },
    template: `<TrustyTable v-bind="args" :rows="slice" v-model:page="page">${actionsSlot}</TrustyTable>`,
  }),
}

/** Checkbox column plus select-all. Disabled rows sit it out, and the status line switches to the selection count. Live — tick the boxes. */
export const Selectable: Story = {
  args: { selectable: true, total: 130 },
  render: args => ({
    components: { TrustyButton, TrustyTable },
    setup() {
      const selected = ref<(string | number)[]>([2, 3])
      return { args, selected }
    },
    template: `<TrustyTable v-bind="args" v-model:selected="selected">${actionsSlot}</TrustyTable>`,
  }),
}

/** Sortable headers report the column and direction through `v-model:sort`; the table reorders nothing itself. Live — this story sorts its own rows off that model, which is the job a consuming app (or its backend) picks up. */
export const Sorted: Story = {
  render: args => ({
    components: { TrustyButton, TrustyTable },
    setup() {
      const sort = ref<TrustyTableSort | undefined>({ key: 'operation', direction: 'asc' })
      const sorted = computed(() => sortRows(args.rows, sort.value))

      return { args, sort, sorted }
    },
    template: `<TrustyTable v-bind="args" :rows="sorted" v-model:sort="sort">${actionsSlot}</TrustyTable>`,
  }),
}

/** No rows: the headers stay so the shape of the data is still legible, and the checkbox column drops out. */
export const Empty: Story = {
  args: { rows: [], selectable: true, total: 0 },
}

/** Text-only cells — every column plain, no descriptions and no slots. */
export const PlainText: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'count', label: 'Count', align: 'end', width: 'hug' },
    ],
    rows: [
      { key: 'a', cells: { name: 'Interview A-cam', type: 'Clip', count: 12 } },
      { key: 'b', cells: { name: 'Drone pass', type: 'Clip', count: 4 } },
      { key: 'c', cells: { name: 'Short film edit', type: 'Timeline', count: 128 } },
    ],
  },
  render: args => ({
    components: { TrustyTable },
    setup: () => ({ args }),
    template: `<TrustyTable v-bind="args" />`,
  }),
}
