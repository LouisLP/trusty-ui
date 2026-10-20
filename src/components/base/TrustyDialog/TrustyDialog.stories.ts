import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { computed, ref } from 'vue'
import TrustyForm from '../../form/TrustyForm/TrustyForm.vue'
import TrustyFormItem from '../../form/TrustyFormItem/TrustyFormItem.vue'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustySelect from '../TrustySelect/TrustySelect.vue'
import TrustyTextInput from '../TrustyTextInput/TrustyTextInput.vue'
import TrustyDialog from './TrustyDialog.vue'

const meta = {
  title: 'Overlays/TrustyDialog',
  component: TrustyDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A modal window: a fixed header with title and close button, an optional description, and free-form body and footer slots. Open it through the trigger slot or drive it with v-model.

**Use it when**
- the user does real work in an overlay: filling a form, adjusting settings, picking from a list, inspecting details.

**Don't use it for**
- a plain yes/no decision with consequences: use TrustyAlertDialog. The litmus test: if the body would just be a question and two buttons, that's TrustyAlertDialog; if the user works inside it, it's this one.
- viewing a single image full-size: use TrustyLightbox
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    title: 'Rename project',
    description: 'Give this project a clear, recognisable name.',
  },
} satisfies Meta<typeof TrustyDialog>

export default meta
type Story = StoryObj<typeof meta>

/** Opened from its own trigger, with a body and footer actions. */
export const Default: Story = {
  render: args => ({
    components: { TrustyDialog, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyDialog v-bind="args">
        <template #trigger>
          <TrustyButton label="Open dialog" />
        </template>

        <p>Body content goes here. Anything in the default slot scrolls if it grows too tall.</p>

        <template #footer="{ close }">
          <TrustyButton variant="ghost" label="Cancel" @click="close" />
          <TrustyButton label="Save" @click="close" />
        </template>
      </TrustyDialog>
    `,
  }),
}

/** Interaction test — the trigger opens the modal, the title and description are announced, and Escape closes it. The dialog portals outside the story root, so this queries the document body rather than the canvas. */
export const OpensAndCloses: Story = {
  render: Default.render,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const screen = within(canvasElement.ownerDocument.body)

    await step('the trigger opens it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }))
      const dialog = await screen.findByRole('dialog')
      // The overlay fades in, so the element is in the DOM at opacity 0 for a frame or two; toBeVisible would fail on that. waitFor rides it out.
      await waitFor(() => expect(dialog).toBeVisible())
      await expect(within(dialog).getByText('Rename project')).toBeVisible()
    })

    await step('Escape closes it', async () => {
      await userEvent.keyboard('{Escape}')
      // ...and fades out, so the node outlives the keypress.
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })
  },
}

/** A tall body: the default slot scrolls within the dialog while the header and footer stay pinned. Custom content fills every slot. */
export const LongBody: Story = {
  args: {
    title: 'Terms of service',
    description: 'Please read the agreement before continuing.',
  },
  render: args => ({
    components: { TrustyDialog, TrustyButton },
    setup: () => ({ args, sections: Array.from({ length: 12 }, (_, i) => i + 1) }),
    template: `
      <TrustyDialog v-bind="args">
        <template #trigger>
          <TrustyButton label="Review terms" />
        </template>

        <section v-for="n in sections" :key="n" style="margin-block-end: var(--space-md);">
          <h3 style="margin: 0 0 var(--space-xs); font-size: var(--font-size-sm); font-weight: bold;">
            {{ n }}. Section heading
          </h3>
          <p style="margin: 0;">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </section>

        <template #footer="{ close }">
          <TrustyButton variant="ghost" label="Decline" @click="close" />
          <TrustyButton label="Accept" @click="close" />
        </template>
      </TrustyDialog>
    `,
  }),
}

/** No description line — just a title and body. */
export const TitleOnly: Story = {
  args: { description: undefined },
  render: args => ({
    components: { TrustyDialog, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyDialog v-bind="args">
        <template #trigger>
          <TrustyButton variant="secondary" label="Open" />
        </template>
        <p>A minimal dialog with no supporting description.</p>
      </TrustyDialog>
    `,
  }),
}

/** The characteristic use: real work inside the overlay. A `TrustyForm` fills the body, with validation owned here in the story, as the library never validates. The footer's submit button reaches the form by `form` id, so the buttons stay pinned while the fields scroll. */
export const WithForm: Story = {
  args: {
    title: 'New project',
    description: 'Name it and choose who can see it.',
  },
  render: args => ({
    components: { TrustyDialog, TrustyForm, TrustyFormItem, TrustyTextInput, TrustySelect, TrustyButton },
    setup() {
      const open = ref(false)
      const name = ref('')
      const visibility = ref<string>()
      const submitted = ref(false)

      const nameError = computed(() =>
        submitted.value && name.value.trim().length < 3 ? 'Use at least 3 characters.' : '')
      const visibilityError = computed(() =>
        submitted.value && !visibility.value ? 'Choose who can see this project.' : '')

      const visibilities = [
        { value: 'private', label: 'Private — only me' },
        { value: 'team', label: 'Team — everyone in the workspace' },
        { value: 'public', label: 'Public — anyone with the link' },
      ]

      function create() {
        submitted.value = true
        if (nameError.value || visibilityError.value)
          return

        // A real app would persist here; the story just resets and closes.
        open.value = false
        submitted.value = false
        name.value = ''
        visibility.value = undefined
      }

      return { args, open, name, visibility, nameError, visibilityError, visibilities, create }
    },
    template: `
      <TrustyDialog v-bind="args" v-model="open">
        <template #trigger>
          <TrustyButton label="New project" icon="ph:plus" />
        </template>

        <TrustyForm id="new-project-form" @submit="create">
          <TrustyFormItem label="Project name" :error="nameError" required>
            <template #default="{ field }">
              <TrustyTextInput v-model="name" placeholder="Short film edit" v-bind="field" />
            </template>
          </TrustyFormItem>

          <TrustyFormItem label="Visibility" hint="You can change this later." :error="visibilityError" required>
            <template #default="{ field }">
              <TrustySelect v-model="visibility" :items="visibilities" placeholder="Choose visibility…" v-bind="field" />
            </template>
          </TrustyFormItem>
        </TrustyForm>

        <template #footer="{ close }">
          <TrustyButton variant="ghost" label="Cancel" @click="close" />
          <TrustyButton type="submit" form="new-project-form" label="Create project" />
        </template>
      </TrustyDialog>
    `,
  }),
}
