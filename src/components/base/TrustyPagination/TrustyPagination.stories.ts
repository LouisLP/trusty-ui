import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyPagination from './TrustyPagination.vue'

const meta = {
  title: 'Navigation/TrustyPagination',
  component: TrustyPagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A page strip for a paged list: jump-to-first and previous arrows, the numbered pages around the current one, then next and jump-to-last. It counts in items, not pages — give it the collection's 'total' and how many fit on a page, and it works the page count out. Pages beyond the window collapse into an ellipsis, and the first and last page stay pinned so the ends are always one click away.

**Use it when**
- a list is served one page at a time and the user picks which page to see.

**Don't use it for**
- a list that grows as the user scrolls: there are no pages to name, so render nothing
- stepping through a sequence of form steps: use TrustyTabs
- paging the rows of a table: use TrustyTable, which houses this in its footer
`,
      },
    },
  },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    total: { control: { type: 'number', min: 0 } },
    itemsPerPage: { control: { type: 'number', min: 1 } },
    siblingCount: { control: { type: 'number', min: 0, max: 4 } },
  },
  args: {
    total: 990,
    itemsPerPage: 10,
    siblingCount: 1,
    showEdges: true,
    disabled: false,
    page: 5,
  },
} satisfies Meta<typeof TrustyPagination>

export default meta
type Story = StoryObj<typeof meta>

/** 99 pages, sitting on page 5 — both ellipses show, both edges stay pinned. */
export const Default: Story = {}

/** Few enough pages to list in full: no ellipsis, nothing collapsed. */
export const FewPages: Story = {
  args: { total: 30, page: 2 },
}

/** On page 1 the backward arrows go dead; only the forward ones stay live. */
export const FirstPage: Story = {
  args: { page: 1 },
}

/** Mirror of the first page — the forward arrows are the dead pair here. */
export const LastPage: Story = {
  args: { page: 99 },
}

/** `siblingCount` widens the window around the current page. */
export const WideWindow: Story = {
  args: { siblingCount: 3 },
}

/** Edges off — no jump-to-end arrows, and the outer pages fall into the ellipses. */
export const WithoutEdges: Story = {
  args: { showEdges: false },
}

/** Inert while the page behind it loads. */
export const Disabled: Story = {
  args: { disabled: true },
}
