import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyToast from './TrustyToast.vue'

const meta = {
  title: 'Feedback/TrustyToast',
  component: TrustyToast,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A transient notice that slides up from the bottom centre of the screen, announces itself, and closes on its own after five seconds. Keep the title around five to seven words. The cadence is fixed — five seconds, paused while the pointer or focus is on the stack — so every toast in the product behaves the same.

Hovering the stack pauses the timer, Escape and a downward swipe dismiss, and \`open\` is two-way: it flips to false however the toast goes away.

**Two ways to raise one.** This component is the declarative one: it brings its own viewport and is driven by \`v-model:open\`, which suits a toast owned by one screen. For toasts raised from TypeScript — a store action, an HTTP interceptor — mount a single TrustyToaster instead and call \`useTrustyToast().toast({ … })\`; that path also stacks several toasts in one viewport, which two TrustyToasts cannot do.

**Use it when**
- confirming something that just happened ('Project saved') or surfacing a background event that needs no response.

**Don't use it for**
- messages that should stay put on the screen: use TrustyBanner
- anything the user must respond to: use TrustyAlert, or TrustyAlertDialog if it should block
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Toast headline (plain string only).' },
    description: { control: 'text', description: 'Optional secondary line.' },
    variant: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'error'],
    },
    open: { control: 'boolean', description: 'Two-way; false renders nothing.' },
  },
  args: {
    title: 'Title',
    description: 'Description will be shown here.',
    variant: 'info',
  },
  decorators: [() => ({ template: '<div style="min-block-size: 16rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyToast>

export default meta
type Story = StoryObj<typeof meta>

// Toasts are transient: a trigger button re-opens them so they can be re-seen.
function render(args: Record<string, unknown>) {
  return {
    components: { TrustyToast, TrustyButton },
    setup() {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <TrustyButton label="Show toast" @click="open = true" />
      <TrustyToast v-bind="args" v-model:open="open" />
    `,
  }
}

/** Default — info toast with title and description. */
export const Info: Story = { render }

export const Success: Story = { args: { variant: 'success', title: 'Saved', description: 'Your changes were saved.' }, render }
export const Warning: Story = { args: { variant: 'warning', title: 'Storage almost full', description: 'Free up space soon.' }, render }
export const Error: Story = { args: { variant: 'error', title: 'Save failed', description: 'Check your connection and retry.' }, render }

/** Title only — description is optional. */
export const TitleOnly: Story = { args: { description: undefined, title: 'Copied to clipboard' }, render }

/** The trigger re-opens a toast that has gone, and the close button dismisses it. */
export const OpensAndDismisses: Story = {
  args: { title: 'Project saved', description: 'All changes are up to date.' },
  render,
  play: async ({ canvasElement, step }) => {
    // The viewport is fixed-positioned but still rendered inside the story, so the canvas reaches it.
    const canvas = within(canvasElement)

    await step('the toast animates in', async () => {
      await waitFor(async () => expect(canvas.getByText('Project saved')).toBeVisible())
    })

    await step('the close button dismisses it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
      await waitFor(async () => expect(canvas.queryByText('Project saved')).not.toBeInTheDocument())
    })

    await step('the trigger brings it back', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }))
      await waitFor(async () => expect(canvas.getByText('Project saved')).toBeVisible())
    })
  },
}
