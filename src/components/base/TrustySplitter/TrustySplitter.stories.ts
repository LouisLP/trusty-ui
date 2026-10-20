import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustySplitter from './TrustySplitter.vue'
import TrustySplitterPanel from './TrustySplitterPanel.vue'

const meta = {
  title: 'Layout/TrustySplitter',
  component: TrustySplitter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Resizable panels: place TrustySplitterPanels in the default slot and the drag handles between them appear automatically. Lay it out horizontally or vertically. Give it a storage key and the layout survives reloads (make the key unique per splitter; a saved layout wins over defaultSize).

**Use it when**
- two or more regions share space the user will want to rebalance: editor plus preview, sidebar plus canvas.

**Don't use it for**
- regions at fixed or purely responsive sizes: lay them out with CSS grid or flex
- a stack of sections that open and close rather than resize: use TrustyAccordion
- one region that only needs to scroll: use TrustyScrollArea
`,
      },
    },
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    autoSaveId: { control: 'text' },
  },
  args: {
    direction: 'horizontal',
  },
  // Give the resizable group a fixed box to fill.
  decorators: [() => ({ template: '<div style="block-size: 18rem; inline-size: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-md);"><story /></div>' })],
} satisfies Meta<typeof TrustySplitter>

export default meta
type Story = StoryObj<typeof meta>

const cell = 'display: grid; place-items: center; block-size: 100%; color: var(--color-text);'

function render(args: Record<string, unknown>) {
  return {
    components: { TrustySplitter, TrustySplitterPanel },
    setup: () => ({ args, cell }),
    template: `
      <TrustySplitter v-bind="args">
        <TrustySplitterPanel :default-size="35" :min-size="15">
          <div :style="cell">Sidebar</div>
        </TrustySplitterPanel>
        <TrustySplitterPanel :min-size="30">
          <div :style="cell">Main</div>
        </TrustySplitterPanel>
      </TrustySplitter>
    `,
  }
}

/** Two panels, drag the handle between them to resize. */
export const Default: Story = { render }

/** Stack panels top-to-bottom instead of side-by-side. */
export const Vertical: Story = { args: { direction: 'vertical' }, render }

/** Pass an `autoSaveId` to remember the layout in localStorage across reloads: drag the handle, reload the page, and the panels keep their sizes. The id must be unique per splitter across the app, and a saved layout wins over the panels' `defaultSize`. */
export const RememberedLayout: Story = { args: { autoSaveId: 'storybook-remembered-layout' }, render }

/** Three panels get two auto-inserted handles. */
export const ThreePanels: Story = {
  render: args => ({
    components: { TrustySplitter, TrustySplitterPanel },
    setup: () => ({ args, cell }),
    template: `
      <TrustySplitter v-bind="args">
        <TrustySplitterPanel :default-size="25" :min-size="15"><div :style="cell">Left</div></TrustySplitterPanel>
        <TrustySplitterPanel :min-size="20"><div :style="cell">Center</div></TrustySplitterPanel>
        <TrustySplitterPanel :default-size="25" :min-size="15"><div :style="cell">Right</div></TrustySplitterPanel>
      </TrustySplitter>
    `,
  }),
}
