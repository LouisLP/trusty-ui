import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyLightbox from './TrustyLightbox.vue'

// A generously-sized placeholder (1080x720) so the story shows an actual image instead of just alt text — real usage passes a real image in the default slot.
const PLACEHOLDER_SRC_AVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720" viewBox="0 0 1080 720">
    <rect width="1080" height="720" fill="#1c1e28"/>
    <text x="50%" y="50%" fill="#c7cbd4" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">1080 x 720</text>
  </svg>`,
)}`

const PLACEHOLDER_SRC_WIDE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="520" viewBox="0 0 1920 520">
    <rect width="1920" height="520" fill="#1c1e28"/>
    <text x="50%" y="50%" fill="#c7cbd4" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">1920 x 520</text>
  </svg>`,
)}`

const PLACEHOLDER_SRC_TALL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="1920" viewBox="0 0 520 1920">
    <rect width="520" height="1920" fill="#1c1e28"/>
    <text x="50%" y="50%" fill="#c7cbd4" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">520 x 1920</text>
  </svg>`,
)}`

const meta = {
  title: 'Overlays/TrustyLightbox',
  component: TrustyLightbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An overlay for looking at one image at its natural size (capped at the viewport), with a caption and a floating close button.

**Use it when**
- an image deserves a closer look and you want to supply your own trigger.

**Don't use it for**
- the common framed-preview case: TrustyThumbnail wraps this and provides the trigger for you
- general modal content: use TrustyDialog
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
  },
  args: {
    title: 'Checker preview',
  },
} satisfies Meta<typeof TrustyLightbox>

export default meta
type Story = StoryObj<typeof meta>

/** Opened from its own trigger; the Close button is pinned to the viewport corner, and the image shrinks to fit while keeping its aspect ratio. */
export const Default: Story = {
  render: args => ({
    components: { TrustyLightbox, TrustyButton },
    setup: () => ({ args, src: PLACEHOLDER_SRC_AVG }),
    template: `
      <TrustyLightbox v-bind="args">
        <template #trigger>
          <TrustyButton label="Open image" />
        </template>

        <img :src="src" :alt="args.title">
      </TrustyLightbox>
    `,
  }),
}

/** A wide image. */
export const WideImage: Story = {
  render: args => ({
    components: { TrustyLightbox, TrustyButton },
    setup: () => ({ args, src: PLACEHOLDER_SRC_WIDE }),
    template: `
      <TrustyLightbox v-bind="args">
        <template #trigger>
          <TrustyButton label="Open image" />
        </template>

        <img :src="src" :alt="args.title">
      </TrustyLightbox>
    `,
  }),
}

/** A tall image. */
export const TallImage: Story = {
  render: args => ({
    components: { TrustyLightbox, TrustyButton },
    setup: () => ({ args, src: PLACEHOLDER_SRC_TALL }),
    template: `
      <TrustyLightbox v-bind="args">
        <template #trigger>
          <TrustyButton label="Open image" />
        </template>

        <img :src="src" :alt="args.title">
      </TrustyLightbox>
    `,
  }),
}
