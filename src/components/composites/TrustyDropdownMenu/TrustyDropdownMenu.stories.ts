import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import TrustyButton from '../../base/TrustyButton/TrustyButton.vue'
import TrustyDropdownMenu from './TrustyDropdownMenu.vue'

const meta = {
  title: 'Overlays/TrustyDropdownMenu',
  component: TrustyDropdownMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A menu of commands behind a trigger. Choosing a row runs an action (the 'select' event reports its value) and the menu closes; nothing stays selected. Rows can carry icons and keyboard-shortcut hints, be disabled one by one, be painted as destructive with 'danger', or open a nested submenu on hover with 'type: submenu' and a 'children' array.

**Use it when**
- several commands need to live behind one button: a row's overflow menu, a toolbar's 'more' button.
- one of those commands branches into variants — 'Export as ▸', 'Move to ▸' — which is what a submenu row is for.

**Don't use it for**
- picking a value in a form. If choosing stores data instead of running a command, use TrustySelect or TrustyCombobox.
- deep submenu trees. Every level is another hover a pointer can fall out of; past two, use TrustyDialog with a real picker instead.
`,
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    disabled: { control: 'boolean' },
    items: { control: 'object' },
  },
  args: {
    side: 'bottom',
    disabled: false,
    items: [
      { value: 'rename', label: 'Rename', icon: 'radix-icons:pencil-1' },
      { value: 'duplicate', label: 'Duplicate', icon: 'radix-icons:copy' },
      { type: 'separator' },
      { value: 'delete', label: 'Delete', icon: 'radix-icons:trash', variant: 'danger' },
    ],
  },
  // Give the portalled menu room to render inside the docs frame.
  decorators: [() => ({ template: '<div style="padding: 4rem; display: flex; justify-content: center;"><story /></div>' })],
} satisfies Meta<typeof TrustyDropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

function render(args: Record<string, unknown>) {
  return {
    components: { TrustyDropdownMenu, TrustyButton },
    setup: () => ({ args }),
    template: `
    <TrustyDropdownMenu v-bind="args" @select="(value) => console.log('select', value)">
      <TrustyButton label="Actions" />
    </TrustyDropdownMenu>
  `,
  }
}

/** Default: action rows with icons and a destructive item below a separator. */
export const Default: Story = { render }

/** Interaction test — opening the menu, choosing a row, and the two things that must follow: the 'select' event carries that row's `value`, and the menu closes. `fn()` makes the handler a spy the Interactions panel can show. */
export const SelectsAnItem: Story = {
  args: { onSelect: fn() },
  render: args => ({
    components: { TrustyDropdownMenu, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyDropdownMenu v-bind="args" @select="args.onSelect">
        <TrustyButton label="Actions" />
      </TrustyDropdownMenu>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    // The menu portals to the body, outside the story root.
    const screen = within(canvasElement.ownerDocument.body)

    await step('open the menu', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
      const menu = await screen.findByRole('menu')
      // The menu fades in, so it is in the DOM at opacity 0 for a frame or two; toBeVisible would fail on that. waitFor rides out the animation.
      await waitFor(() => expect(menu).toBeVisible())
    })

    await step('choosing a row reports its value and closes', async () => {
      await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }))
      await expect(args.onSelect).toHaveBeenCalledWith('duplicate')
      await expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  },
}

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
    components: { TrustyDropdownMenu, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyDropdownMenu v-bind="args" @select="args.onSelect">
        <TrustyButton label="Actions" />
      </TrustyDropdownMenu>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)
    // The panes portal to the body, outside the story root.
    const screen = within(canvasElement.ownerDocument.body)

    await step('open the menu', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
      // The menu fades in, so it is in the DOM at opacity 0 for a frame or two; toBeVisible would fail on that. waitFor rides out the animation.
      await waitFor(() => expect(screen.getByRole('menu')).toBeVisible())
    })

    await step('the branch row carries a visible trailing chevron', async () => {
      const row = screen.getByRole('menuitem', { name: /Move to/ })
      const marker = row.querySelector('.trusty-dropdown-menu-item-marker')!
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
 * A menu longer than the space below the trigger stops at the viewport edge and scrolls the rest, rather than running off screen — the same cap TrustySelect's list uses. Nothing to opt into: pass as many rows as the situation has.
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

    await step('open the menu', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
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

    // Close before the axe pass: an open modal menu aria-hides the rest of the page, trigger included, which axe reads as a focusable element inside aria-hidden. Focus is trapped in the menu while it's open, so that state is Reka's intended one, not a defect.
    await step('Escape closes the menu and hands focus back to the trigger', async () => {
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
      expect(canvas.getByRole('button', { name: 'Actions' })).toHaveFocus()
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

/** Keyboard-shortcut hints sit at the end of the row (display only — key handling stays with the consumer). */
export const WithShortcuts: Story = {
  args: {
    items: [
      { value: 'rename', label: 'Rename', icon: 'radix-icons:pencil-1', shortcut: ['F2'] },
      { value: 'duplicate', label: 'Duplicate', icon: 'radix-icons:copy', shortcut: ['mod', 'D'] },
      { type: 'separator' },
      { value: 'delete', label: 'Delete', icon: 'radix-icons:trash', variant: 'danger', shortcut: ['delete'] },
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

/** Disabled — the trigger renders but the menu never opens. */
export const Disabled: Story = { args: { disabled: true }, render }
