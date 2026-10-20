import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyToaster from './TrustyToaster.vue'
import { useTrustyToast } from './useTrustyToast'

const meta = {
  title: 'Feedback/TrustyToaster',
  component: TrustyToaster,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The app-level toast host. It takes no props: mount exactly one, high in the tree, and every toast raised through \`useTrustyToast()\` appears in its viewport — stacked bottom centre, newest last.

\`\`\`ts
// anywhere, including a plain .ts module with no component in scope
import { useTrustyToast } from '@louislp/trusty-ui'

const { toast, dismiss, dismissAll } = useTrustyToast()

const id = toast({ title: 'Project saved', description: 'All changes are up to date.' })
toast({ title: 'Save failed', variant: 'error' })
dismiss(id)   // early, before the five seconds are up
\`\`\`

\`toast()\` returns the id so a toast can be dismissed early; the queue is also readable as \`toasts\` if a screen wants to reflect it. Reka UI's toast primitive ships no imperative API of its own, so this composable is the library's — a module-level queue this component renders.

**Use it when**
- toasts are raised from TypeScript rather than a template: a store action, an HTTP interceptor, a keyboard shortcut handler — or whenever several toasts may be on screen at once.

**Don't use it for**
- a toast owned by one screen and driven by a boolean: use TrustyToast, which brings its own viewport
- messages that should stay put on the screen: use TrustyBanner
- anything the user must respond to: use TrustyAlert, or TrustyAlertDialog if it should block
`,
      },
    },
  },
  // The viewport is fixed-positioned, and a Storybook docs story block is its containing block — so the canvas needs room for a stack of three under the triggers.
  decorators: [() => ({ template: '<div style="min-block-size: 22rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyToaster>

export default meta
type Story = StoryObj<typeof meta>

// The toaster renders nothing until something is queued, so every story pairs it with triggers.
function render() {
  return {
    components: { TrustyToaster, TrustyButton },
    setup() {
      const { toast, dismissAll } = useTrustyToast()
      return { toast, dismissAll }
    },
    template: `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <TrustyButton label="Info" @click="toast({ title: 'Project saved', description: 'All changes are up to date.' })" />
        <TrustyButton label="Success" variant="secondary" @click="toast({ title: 'Deployed', description: 'Version 2.4 is live.', variant: 'success' })" />
        <TrustyButton label="Warning" variant="outline" @click="toast({ title: 'Storage almost full', description: 'Free up space soon.', variant: 'warning' })" />
        <TrustyButton label="Error" variant="danger" @click="toast({ title: 'Save failed', description: 'Check your connection and retry.', variant: 'error' })" />
        <TrustyButton label="Dismiss all" variant="ghost" @click="dismissAll()" />
      </div>
      <TrustyToaster />
    `,
  }
}

/** Each button raises one toast; raise several to see them stack. */
export const Default: Story = { render }

/** Several toasts share one viewport, and dismissing one leaves the rest alone. */
export const StacksAndDismisses: Story = {
  render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('two toasts stack in one viewport', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Info' }))
      await userEvent.click(canvas.getByRole('button', { name: 'Error' }))
      await waitFor(async () => expect(canvas.getByText('Project saved')).toBeVisible())
      await waitFor(async () => expect(canvas.getByText('Save failed')).toBeVisible())
    })

    await step('dismissing one leaves the other', async () => {
      const [first] = canvas.getAllByRole('button', { name: 'Dismiss' })
      await userEvent.click(first as HTMLElement)
      await waitFor(async () => expect(canvas.queryByText('Project saved')).not.toBeInTheDocument())
      await waitFor(async () => expect(canvas.getByText('Save failed')).toBeVisible())
    })

    await step('dismissAll clears the stack', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Dismiss all' }))
      await waitFor(async () => expect(canvas.queryByText('Save failed')).not.toBeInTheDocument())
    })
  },
}
