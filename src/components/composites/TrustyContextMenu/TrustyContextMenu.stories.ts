import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import TrustyContextMenu from './TrustyContextMenu.vue'

const meta = {
  title: 'Overlays/TrustyContextMenu',
  component: TrustyContextMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A menu of commands that opens on right-click (or the keyboard's menu key), anchored at the pointer. It takes the same 'items' shape as TrustyDropdownMenu: rows can carry icons and keyboard-shortcut hints, be disabled one by one, be painted as destructive with 'danger', or open a nested submenu on hover with 'type: submenu' and a 'children' array. The default slot is the area the menu belongs to.

**Use it when**
- commands act on the thing under the pointer: a tree node, a canvas object, a list row.
- a long command list needs grouping the pointer can walk into — 'Move to ▸', 'Export as ▸' — which is what a submenu row is for.

**Don't use it for**
- commands behind a visible button — that's TrustyDropdownMenu. A context menu is invisible until right-clicked, so never make it the only way to reach an action.
- deep submenu trees. Every level is another hover a pointer can fall out of; past two, use TrustyDialog with a real picker instead.
`,
      },
    },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    items: { control: 'object' },
  },
  args: {
    disabled: false,
    items: [
      { value: 'rename', label: 'Rename', icon: 'radix-icons:pencil-1', shortcut: ['F2'] },
      { value: 'duplicate', label: 'Duplicate', icon: 'radix-icons:copy', shortcut: ['mod', 'D'] },
      { type: 'separator' },
      { value: 'delete', label: 'Delete', icon: 'radix-icons:trash', variant: 'danger', shortcut: ['delete'] },
    ],
  },
  // Give the portalled menu room to render inside the docs frame.
  decorators: [() => ({ template: '<div style="padding: 4rem; display: flex; justify-content: center;"><story /></div>' })],
} satisfies Meta<typeof TrustyContextMenu>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyContextMenu },
    setup: () => ({ args }),
    template: `
    <TrustyContextMenu v-bind="args" @select="(value) => console.log('select', value)">
      <div style="display: grid; place-items: center; inline-size: 16rem; block-size: 8rem; border: 1px dashed var(--color-border); border-radius: var(--radius-md); color: var(--color-text-muted); font-family: var(--font-family-sans); font-size: var(--font-size-sm); user-select: none;">
        Right-click here
      </div>
    </TrustyContextMenu>
  `,
  }
}

/** Default: action rows with icons, shortcut hints, and a destructive item below a separator. */
export const Default: Story = { render }

/** A `submenu` row opens a nested pane on hover — the pattern desktop apps use for 'Move to ▸'. Its `children` take the same `items` shape, so a submenu can hold separators, labels, and further submenus; `select` still reports from the one root event, whatever depth the chosen row sat at. */
export const NestedSubmenu: Story = {
  args: {
    items: [
      { value: 'rename', label: 'Rename', icon: 'radix-icons:pencil-1' },
      {
        type: 'submenu',
        label: 'Move to',
        icon: 'ph:folder-plus',
        children: [
          { value: 'move:inbox', label: 'Inbox' },
          { value: 'move:archive', label: 'Archive' },
          { type: 'separator' },
          {
            type: 'submenu',
            label: 'Team',
            children: [
              { value: 'move:team:design', label: 'Design' },
              { value: 'move:team:engineering', label: 'Engineering' },
            ],
          },
        ],
      },
      { type: 'separator' },
      { value: 'delete', label: 'Delete', icon: 'radix-icons:trash', variant: 'danger' },
    ],
  },
  render,
}

/** Interaction test — the nested hover itself, which is the whole point of a submenu and the one thing jsdom cannot drive: hovering the row opens its pane, and choosing a row two levels down still reports through the root `select`. */
export const OpensSubmenuOnHover: Story = {
  args: {
    onSelect: fn(),
    items: [
      { value: 'rename', label: 'Rename', icon: 'radix-icons:pencil-1' },
      {
        type: 'submenu',
        label: 'Move to',
        icon: 'ph:folder-plus',
        children: [
          { value: 'move:inbox', label: 'Inbox' },
          { value: 'move:archive', label: 'Archive' },
          { type: 'separator' },
          {
            type: 'submenu',
            label: 'Team',
            children: [
              { value: 'move:team:design', label: 'Design' },
              { value: 'move:team:engineering', label: 'Engineering' },
            ],
          },
        ],
      },
      { type: 'separator' },
      { value: 'delete', label: 'Delete', icon: 'radix-icons:trash', variant: 'danger' },
    ],
  },
  render: args => ({
    components: { TrustyContextMenu },
    setup: () => ({ args }),
    template: `
      <TrustyContextMenu v-bind="args" @select="args.onSelect">
        <div data-testid="area" style="display: grid; place-items: center; inline-size: 16rem; block-size: 8rem; border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
          Right-click here
        </div>
      </TrustyContextMenu>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    // The panes portal to the body, outside the story root.
    const screen = within(canvasElement.ownerDocument.body)

    await step('right-click opens the menu', async () => {
      await userEvent.pointer({ keys: '[MouseRight]', target: canvas.getByTestId('area') })
      // The menu fades in, so it is in the DOM at opacity 0 for a frame or two; toBeVisible would fail on that. waitFor rides out the animation.
      await waitFor(() => expect(screen.getByRole('menu')).toBeVisible())
    })

    await step('the branch row carries a visible trailing chevron', async () => {
      const row = screen.getByRole('menuitem', { name: /Move to/ })
      const marker = row.querySelector('.trusty-context-menu-item-marker')!
      // The glyph, not the wrapper: a 1em icon box keeps its measured size while its content box collapses, so only the svg shows the chevron actually rendering. jsdom applies no SFC styles.
      const glyph = marker.querySelector('svg')!
      await waitFor(() => expect(glyph.getBoundingClientRect().width).toBeGreaterThan(0))
      expect(marker.getBoundingClientRect().right)
        .toBeGreaterThan(row.getBoundingClientRect().right - 24)
    })

    await step('hovering the submenu row opens its pane', async () => {
      await userEvent.hover(screen.getByRole('menuitem', { name: /Move to/ }))
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeVisible())
    })

    await step('a submenu inside the submenu opens the same way', async () => {
      await userEvent.hover(screen.getByRole('menuitem', { name: /Team/ }))
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Engineering' })).toBeVisible())
    })

    await step('choosing a row two levels down reports through the root select', async () => {
      await userEvent.click(screen.getByRole('menuitem', { name: 'Engineering' }))
      await expect(args.onSelect).toHaveBeenCalledWith('move:team:engineering')
      // Choosing closes the whole tree, not just the pane it was in.
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    })
  },
}

/**
 * A menu longer than the space below the pointer stops at the viewport edge and scrolls the rest, rather than running off screen — the same cap TrustySelect's list uses. Nothing to opt into: pass as many rows as the situation has.
 *
 * Interaction test — the overflow itself, which needs real layout and so cannot be asserted in jsdom.
 */
export const Scrollable: Story = {
  args: {
    items: Array.from({ length: 40 }, (_, i) => ({
      value: `layer:${i + 1}`,
      label: `Layer ${i + 1}`,
      icon: 'radix-icons:copy',
    })),
  },
  render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const screen = within(canvasElement.ownerDocument.body)

    await step('right-click opens the menu', async () => {
      await userEvent.pointer({ keys: '[MouseRight]', target: canvas.getByText('Right-click here') })
      await waitFor(() => expect(screen.getByRole('menu')).toBeVisible())
    })

    await step('the menu is capped to the viewport and scrolls its overflow', async () => {
      const menu = screen.getByRole('menu')
      await waitFor(() => expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight))
      expect(menu.getBoundingClientRect().height)
        .toBeLessThanOrEqual(canvasElement.ownerDocument.documentElement.clientHeight)
    })

    await step('the last row is reachable by scrolling', async () => {
      const menu = screen.getByRole('menu')
      menu.scrollTop = menu.scrollHeight
      await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Layer 40' })).toBeVisible())
    })
  },
}

/** Section labels group related actions. */
export const WithSections: Story = {
  args: {
    items: [
      { type: 'label', label: 'Edit' },
      { value: 'rename', label: 'Rename', icon: 'radix-icons:pencil-1' },
      { value: 'duplicate', label: 'Duplicate', icon: 'radix-icons:copy' },
      { type: 'separator' },
      { type: 'label', label: 'Danger zone' },
      { value: 'delete', label: 'Delete', icon: 'radix-icons:trash', variant: 'danger' },
    ],
  },
  render,
}

/** A disabled row stays visible but cannot be chosen. */
export const DisabledItem: Story = {
  args: {
    items: [
      { value: 'open', label: 'Open' },
      { value: 'share', label: 'Share (unavailable)', disabled: true },
      { value: 'archive', label: 'Archive' },
    ],
  },
  render,
}

/** Disabled — right-click falls back to the browser's own menu. */
export const Disabled: Story = { args: { disabled: true }, render }
