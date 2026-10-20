import type { Meta, StoryObj } from '@storybook/vue3-vite'
import TrustyButton from '../TrustyButton/TrustyButton.vue'
import TrustyAlertDialog from './TrustyAlertDialog.vue'

const meta = {
  title: 'Overlays/TrustyAlertDialog',
  component: TrustyAlertDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A modal that interrupts for a single yes/no decision with consequences. The footer is a fixed confirm/cancel pair (it emits 'confirm' and 'cancel'), there is no free-form body, and clicking outside won't dismiss it, so the user has to actually choose.

**Use it when**
- confirming something destructive or hard to undo: delete, discard changes, overwrite, leave without saving.

**Don't use it for**
- modals where the user does real work (forms, settings, pickers): use TrustyDialog. A handy litmus test: if the body is just a question and two buttons, it belongs here; if the user works inside it, it doesn't.
`,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    title: 'Delete this file?',
    description: 'This action is permanent and cannot be undone.',
  },
} satisfies Meta<typeof TrustyAlertDialog>

export default meta
type Story = StoryObj<typeof meta>

/** A destructive confirmation opened from its own trigger. */
export const Default: Story = {
  render: args => ({
    components: { TrustyAlertDialog, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyAlertDialog v-bind="args" @confirm="() => {}" @cancel="() => {}">
        <template #trigger>
          <TrustyButton variant="outline" label="Delete file" />
        </template>
      </TrustyAlertDialog>
    `,
  }),
}

/** A lower-stakes confirmation. */
export const SoftConfirm: Story = {
  args: {
    title: 'Leave this page?',
    description: 'Your draft is saved automatically.',
  },
  render: args => ({
    components: { TrustyAlertDialog, TrustyButton },
    setup: () => ({ args }),
    template: `
      <TrustyAlertDialog v-bind="args">
        <template #trigger>
          <TrustyButton variant="ghost" label="Leave" />
        </template>
      </TrustyAlertDialog>
    `,
  }),
}
