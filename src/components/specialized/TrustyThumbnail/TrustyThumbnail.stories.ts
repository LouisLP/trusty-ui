import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyThumbnail from './TrustyThumbnail.vue'

// TrustyThumbnail is fill-parent by design (it stretches to the container the consumer gives it — a widget frame, a form cell). Every story therefore renders inside a fixed-size box; without one the thumbnail would fill the whole canvas.
function placeholder(width: number, height: number, label = `${width} x ${height}`) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#1c1e28"/>
      <text x="50%" y="50%" fill="#c7cbd4" font-family="sans-serif" font-size="${Math.max(14, Math.round(height / 12))}" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`,
  )}`
}

const PREVIEW_SRC = placeholder(256, 160, '256 x 160 preview')
const FULL_SRC = placeholder(1080, 720, '1080 x 720 full resolution')
const WIDE_SRC = placeholder(1920, 520)
const TALL_SRC = placeholder(520, 1920)

const meta = {
  title: 'Data Display/TrustyThumbnail',
  component: TrustyThumbnail,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A clickable, framed image preview that opens the full-resolution source in a TrustyLightbox ('fullSrc' falls back to 'src').

**Use it when**
- an image should sit small in the layout but open large on click.

**Don't use it for**
- a custom trigger or your own preview treatment: use TrustyLightbox directly
`,
      },
    },
  },
  argTypes: {
    src: { control: 'text' },
    lightboxSrc: { control: 'text' },
    alt: { control: 'text' },
  },
  args: {
    src: PREVIEW_SRC,
    alt: 'Checker preview',
  },
} satisfies Meta<typeof TrustyThumbnail>

// TrustyThumbnail stretches to its container, so single-thumbnail stories pin a consistent 256x160 frame around it (multi-thumbnail stories lay out their own).
const inFixedFrame = [
  () => ({ template: '<div style="display: flex; width: 256px; height: 160px;"><story /></div>' }),
]

export default meta
type Story = StoryObj<typeof meta>

/** Clicking the framed preview opens the same image in a TrustyLightbox. */
export const Default: Story = {
  decorators: inFixedFrame,
}

/** A downscaled inline preview with a separate full-resolution lightbox source — the lightbox shows the sharp original. */
export const HigherResolutionLightbox: Story = {
  decorators: inFixedFrame,
  args: {
    lightboxSrc: FULL_SRC,
  },
}

/** A wide source letterboxes inside the fixed frame (`object-fit: contain`) instead of being cropped. */
export const WideImage: Story = {
  decorators: inFixedFrame,
  args: {
    src: WIDE_SRC,
    alt: 'Wide capture',
  },
}

/** A tall source pillarboxes inside the fixed frame instead of being cropped. */
export const TallImage: Story = {
  decorators: inFixedFrame,
  args: {
    src: TALL_SRC,
    alt: 'Tall capture',
  },
}

/** Without `alt`, the trigger falls back to a generic accessible label and the lightbox to a generic title. */
export const NoAltText: Story = {
  decorators: inFixedFrame,
  args: {
    alt: '',
  },
}

/** The thumbnail stretches to whatever frame the consumer provides — same component, three container sizes. */
export const ContainerSizes: Story = {
  render: args => ({
    components: { TrustyThumbnail },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: 16px; align-items: flex-end;">
        <div style="display: flex; width: 96px; height: 96px;">
          <TrustyThumbnail v-bind="args" alt="Small" />
        </div>
        <div style="display: flex; width: 256px; height: 160px;">
          <TrustyThumbnail v-bind="args" alt="Medium" />
        </div>
        <div style="display: flex; width: 480px; height: 240px;">
          <TrustyThumbnail v-bind="args" alt="Large" />
        </div>
      </div>
    `,
  }),
}

/** Several thumbnails in a uniform grid, as a gallery consumer would lay them out. */
export const Gallery: Story = {
  render: args => ({
    components: { TrustyThumbnail },
    setup: () => ({
      args,
      sources: [PREVIEW_SRC, WIDE_SRC, TALL_SRC, FULL_SRC],
    }),
    template: `
      <div style="display: grid; grid-template-columns: repeat(4, 160px); gap: 12px;">
        <div
          v-for="(src, index) in sources"
          :key="index"
          style="display: flex; height: 120px;"
        >
          <TrustyThumbnail :src="src" :alt="'Capture ' + (index + 1)" />
        </div>
      </div>
    `,
  }),
}
