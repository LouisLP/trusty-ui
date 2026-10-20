import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyIcon from './TrustyIcon.vue'

// TrustyIcon renders any Iconify icon; the ones the library's own components use are bundled and render offline.
const meta = {
  title: 'Media/TrustyIcon',
  component: TrustyIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Renders any Iconify icon, named in collection:icon form ('ph:house'). The library defaults to Phosphor regular ('ph:*'); browse names at https://icon-sets.iconify.design/. The icons the library's own components use are bundled and render offline; any other name is fetched from the Iconify API on first render. Give it a token size, or omit 'size' and it renders at 1em, tracking the surrounding text.

**Use it when**
- a glyph needs to appear on its own, outside any component that already takes an icon name.

**Don't use it for**
- an icon inside a component that has an icon prop (TrustyButton, TrustyToggle, TrustyTabs and friends): pass the name, don't nest one
- a clickable glyph: use TrustyButton with 'icon' and no label, paired with an aria-label
- status next to text: use TrustyBadge
`,
      },
    },
  },
  argTypes: {
    name: { control: 'text', description: 'Iconify name in collection:icon form ("ph:house").' },
    size: { control: 'inline-radio', options: [undefined, 'xs', 'sm', 'md', 'lg'], description: 'Fixed design-token size. Omit for 1em (tracks surrounding text).' },
  },
  args: {
    name: 'ph:x',
    size: 'md',
  },
} satisfies Meta<typeof TrustyIcon>

export default meta
type Story = StoryObj<typeof meta>

/** An icon the library bundles: it renders with no network. Inherits `currentColor`. */
export const Bundled: Story = {}

/** Any other Iconify icon, via the same `name` prop: fetched from the Iconify API. */
export const Iconify: Story = { args: { name: 'mdi:home' } }

/** `size` picks a fixed design-token size, independent of surrounding text. */
export const Sizes: Story = {
  render: () => ({
    components: { TrustyIcon },
    setup: () => ({ sizes: ['xs', 'sm', 'md', 'lg'] as const }),
    template: `
      <div style="display:flex; gap:1.5rem; align-items:center; color:var(--color-primary-highlight, #426e9b)">
        <TrustyIcon v-for="s in sizes" :key="s" name="ph:gear" :size="s" />
      </div>
    `,
  }),
}

/** Icons are square and tint to the surrounding text colour. */
export const Gallery: Story = {
  render: () => ({
    components: { TrustyIcon },
    setup: () => ({ names: ['ph:plus', 'ph:caret-right', 'ph:gear', 'ph:trash', 'ph:magnifying-glass', 'ph:house', 'mdi:rocket-launch'] }),
    template: `
      <div style="display:flex; gap:1.5rem; align-items:center; font-size:2rem; color:var(--color-primary-highlight, #426e9b)">
        <TrustyIcon v-for="n in names" :key="n" :name="n" />
      </div>
    `,
  }),
}
