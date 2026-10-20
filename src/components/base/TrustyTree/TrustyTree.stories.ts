import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { TrustyMenuItem } from '../../composites/menu-items'
import type { TrustyTreeItem } from './TrustyTree.types'
import { ref } from 'vue'
import TrustyContextMenu from '../../composites/TrustyContextMenu/TrustyContextMenu.vue'
import TrustyTree from './TrustyTree.vue'

const ITEMS: TrustyTreeItem[] = [
  {
    id: 'rig',
    label: 'Rig',
    children: [
      {
        id: 'camera',
        label: 'Camera',
        children: [
          { id: 'focal-length', label: 'focal_length', icon: 'ph:brackets-curly', tags: ['purple', 'forest', 'mint', 'magenta'] },
          { id: 'aperture', label: 'aperture', icon: 'ph:brackets-curly', tags: ['blue', 'mint'] },
          { id: 'shutter-angle', label: 'shutter_angle', icon: 'ph:brackets-curly' },
        ],
      },
      { id: 'no-icon', label: 'no_icon' },
      {
        id: 'light',
        label: 'Light',
        children: [
          { id: 'intensity', label: 'intensity', icon: 'ph:brackets-curly' },
        ],
      },
    ],
  },
  { id: 'frame-rate', label: 'frame_rate', icon: 'ph:brackets-curly', tags: ['forest'] },
  { id: 'motion-blur', label: 'motion_blur', icon: 'ph:brackets-curly' },
]

const meta = {
  title: 'Navigation/TrustyTree',
  component: TrustyTree,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A nested tree of selectable rows. Parents expand/collapse on click (or ←/→), rows select on click / Enter / Space, and ↑/↓ move focus — all from Reka's Tree primitive. 'v-model' holds the selected row's id, 'v-model:expanded' the ids of open parents. The selected row's group — its parent and siblings — tints as the active branch. Each item can carry color 'tags', shown right-aligned at the end of its row.

Set 'draggable' and rows reorder: drag one onto another row's top or bottom quarter to drop it before or after, onto the middle to nest it inside — or move the focused row with Ctrl/⌘ + Shift + ↑↓←→, so the reorder has a keyboard path too. Rows that model 'children' (an empty array counts) accept nesting; leaves do not, and nothing can be dropped into its own subtree. Bind the rows with 'v-model:items' and the tree applies the reorder itself; bind them as a plain 'items' prop and the 'move' event ('{ id, targetId, position }') is yours to apply — 'moveTreeItem(items, move)', the same pure helper the component uses, is exported for that.

Rows also emit 'row-contextmenu' with the row that was right-clicked, so one surrounding 'TrustyContextMenu' can serve the whole tree — the native right-click still bubbles out to it, which is why the event is not called 'contextmenu'.

**Use it when**
- navigating hierarchical content (folders, task structures, variable scopes) where one row at a time is the working selection
- the hierarchy is the user's to rearrange — 'draggable' reorders and re-parents rows in place

**Don't use it for**
- flat options: use TrustySelect, or TrustyRadioGroup for a short list
- reordering a flat list: use TrustyTable, whose rows carry no hierarchy to re-parent into
- a few peer views: use TrustyTabs
- selecting several rows at once: 'v-model' holds exactly one row's id
`,
      },
    },
  },
  args: {
    items: ITEMS,
    modelValue: 'aperture',
    expanded: ['rig', 'camera'],
  },
  render: args => ({
    components: { TrustyTree },
    setup: () => ({ args }),
    template: `<TrustyTree v-bind="args" style="inline-size: var(--size-2xs)" />`,
  }),
} satisfies Meta<typeof TrustyTree>

export default meta
type Story = StoryObj<typeof meta>

/** Expanded branches with a selection — its parent group tints as the active branch. */
export const Default: Story = {}

/** Everything collapsed and nothing selected; click a folder or press → to drill in. */
export const Collapsed: Story = {
  args: { modelValue: undefined, expanded: [] },
}

/** A single disabled row: dimmed, focusable, but never selects or toggles. */
export const DisabledItem: Story = {
  args: {
    modelValue: undefined,
    expanded: ['rig'],
    items: [
      {
        id: 'rig',
        label: 'Rig',
        children: [
          { id: 'camera', label: 'Camera' },
          { id: 'light', label: 'Light (locked)', disabled: true },
        ],
      },
    ],
  },
}

/** The whole tree disabled. */
export const Disabled: Story = {
  args: { disabled: true, modelValue: undefined },
}

/** Reorderable rows, held by `v-model:items` so the tree applies each move itself. Drag a row onto another row's top or bottom edge to drop it before or after; onto a folder's middle to nest it inside. Focus a row and press Ctrl/⌘ + Shift + ↑↓←→ for the same moves from the keyboard. */
export const Draggable: Story = {
  args: { draggable: true, modelValue: undefined, expanded: ['rig', 'camera', 'light'] },
  render: args => ({
    components: { TrustyTree },
    setup() {
      const items = ref<TrustyTreeItem[]>(structuredClone(ITEMS))
      const last = ref<string>()
      return { args, items, last }
    },
    template: `
      <TrustyTree
        v-bind="args"
        v-model:items="items"
        style="inline-size: var(--size-2xs)"
        @move="last = \`\${$event.id} → \${$event.position} \${$event.targetId}\`"
      />
      <p style="margin-block-start: var(--space-md); font-size: var(--font-size-xs); color: var(--color-text-toned)">
        last move: {{ last ?? '—' }}
      </p>
    `,
  }),
}

/** One `TrustyContextMenu` around the whole tree, with its items built from the row the `row-contextmenu` event reports — no per-row wiring, and it composes with `draggable`. */
export const WithContextMenu: Story = {
  args: { draggable: true, modelValue: undefined, expanded: ['rig', 'camera'] },
  render: args => ({
    components: { TrustyTree, TrustyContextMenu },
    setup() {
      const items = ref<TrustyTreeItem[]>(structuredClone(ITEMS))
      const target = ref<TrustyTreeItem>()
      const chosen = ref<string>()
      const menu = (item: TrustyTreeItem | undefined): TrustyMenuItem[] => [
        { type: 'label', label: item?.label ?? 'No row' },
        { value: 'rename', label: 'Rename', icon: 'ph:pencil-simple' },
        { value: 'duplicate', label: 'Duplicate', icon: 'ph:copy-simple' },
        { type: 'separator' },
        { value: 'delete', label: 'Delete', icon: 'ph:trash', variant: 'danger' },
      ]
      const onSelect = (value: string) => {
        chosen.value = `${value} → ${target.value?.label ?? '—'}`
      }
      return { args, items, target, menu, chosen, onSelect }
    },
    template: `
      <TrustyContextMenu
        :items="menu(target)"
        @select="onSelect"
      >
        <TrustyTree
          v-bind="args"
          v-model:items="items"
          style="inline-size: var(--size-2xs)"
          @row-contextmenu="item => target = item"
        />
      </TrustyContextMenu>
      <p style="margin-block-start: var(--space-md); font-size: var(--font-size-xs); color: var(--color-text-toned)">
        last action: {{ chosen ?? '—' }}
      </p>
    `,
  }),
}
