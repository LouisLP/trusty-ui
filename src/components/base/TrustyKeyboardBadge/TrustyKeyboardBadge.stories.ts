import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { TRUSTY_KEYBOARD_KEY_GLYPHS } from './TrustyKeyboardBadge.keys'
import TrustyKeyboardBadge from './TrustyKeyboardBadge.vue'

const meta = {
  title: 'Data Display/TrustyKeyboardBadge',
  component: TrustyKeyboardBadge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small badge showing a keyboard shortcut as one key-cap chip per key. 'mod' renders the platform's primary modifier (⌘ on Apple, Ctrl elsewhere) — prefer it over 'cmd'/'ctrl' for cross-platform shortcuts. Named special keys ('cmd', 'shift', 'up', …) always render their own symbol; text keys render literally ('D', 'F2', 'Esc'). The key type is a closed union (no free-form strings) — extend TrustyKeyboardKey when a key is missing. Purely visual — it never listens for the keys itself; whoever renders it owns the actual key handling.

**Use it when**
- hinting at a shortcut next to a command: a menu row, a tooltip, a help page.

**Don't use it for**
- status or category labels — that's TrustyBadge.
`,
      },
    },
  },
  argTypes: {
    keys: { control: 'object' },
  },
  args: {
    keys: ['mod', 'shift', 'D'],
  },
} satisfies Meta<typeof TrustyKeyboardBadge>

export default meta
type Story = StoryObj<typeof meta>

/** Default: 'mod' resolves to this platform's primary modifier; named special keys render as glyphs, the rest as text. */
export const Default: Story = {}

/** A single text key. */
export const SingleKey: Story = { args: { keys: ['Esc'] } }

/** Every named special key and its glyph. */
export const NamedKeys: Story = {
  render: () => ({
    components: { TrustyKeyboardBadge },
    setup: () => ({ names: Object.keys(TRUSTY_KEYBOARD_KEY_GLYPHS) }),
    template: `
      <div style="display: grid; grid-template-columns: max-content max-content; gap: var(--space-sm) var(--space-md); align-items: center;">
        <template v-for="name in names" :key="name">
          <code style="color: var(--color-text-muted); font-size: var(--font-size-xs);">{{ name }}</code>
          <TrustyKeyboardBadge :keys="[name]" />
        </template>
      </div>
    `,
  }),
}
