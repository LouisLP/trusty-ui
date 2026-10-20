import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { computed, ref } from 'vue'
import TrustyButton from '../../base/TrustyButton/TrustyButton.vue'
import TrustySecretInput from '../../base/TrustySecretInput/TrustySecretInput.vue'
import TrustyTextInput from '../../base/TrustyTextInput/TrustyTextInput.vue'
import TrustyFormItem from '../TrustyFormItem/TrustyFormItem.vue'
import TrustyForm from './TrustyForm.vue'

const meta = {
  title: 'Form/Layout/TrustyForm',
  component: TrustyForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Layer 3 of the form system: a native form (with novalidate) that spaces its fields, hosts an #actions slot, emits 'submit', and renders an error-summary box from the 'errors' prop, where each entry may link to its field via targetId. Validation strategy stays with you; the form just lays out and reports.

**Use it when**
- building any submitted form. Wrap each control in a TrustyFormItem inside it.

**Don't use it for**
- a single labelled control that nothing submits: TrustyFormItem on its own is layer 2, and enough
- validation: no layer validates, the app owns the v-models and decides what counts as an error
- laying out controls that are not a form: ordinary layout plus TrustyFormItem does that
`,
      },
    },
  },
  argTypes: {
    summaryTitle: { control: 'text' },
  },
  args: {
    summaryTitle: 'Please fix the following:',
  },
  decorators: [() => ({ template: '<div style="max-inline-size: 26rem;"><story /></div>' })],
} satisfies Meta<typeof TrustyForm>

export default meta
type Story = StoryObj<typeof meta>

// A full sign-in form: per-field errors via TrustyFormItem, a summary via TrustyForm, validation owned by the consumer (here a trivial on-submit check).
export const SignIn: Story = {
  render: args => ({
    components: { TrustyForm, TrustyFormItem, TrustyTextInput, TrustySecretInput, TrustyButton },
    setup() {
      const email = ref('')
      const password = ref('')
      const submitted = ref(false)

      const emailError = computed(() =>
        submitted.value && !email.value.includes('@') ? 'Enter a valid email address.' : '')
      const passwordError = computed(() =>
        submitted.value && password.value.length < 8 ? 'Must be at least 8 characters.' : '')

      const summary = computed(() =>
        [
          emailError.value ? { message: emailError.value, targetId: 'email-field' } : null,
          passwordError.value ? { message: passwordError.value, targetId: 'password-field' } : null,
        ].filter(Boolean))

      function save() {
        submitted.value = true
      }

      return { args, email, password, emailError, passwordError, summary, save }
    },
    template: `
      <TrustyForm v-bind="args" :errors="summary" @submit="save">
        <TrustyFormItem label="Email" control-id="email-field" :error="emailError" required>
          <template #default="{ field }">
            <TrustyTextInput v-model="email" type="email" v-bind="field" />
          </template>
        </TrustyFormItem>
        <TrustyFormItem label="Password" control-id="password-field" hint="At least 8 characters." :error="passwordError" required>
          <template #default="{ field }">
            <TrustySecretInput v-model="password" v-bind="field" />
          </template>
        </TrustyFormItem>
        <template #actions>
          <TrustyButton type="submit" label="Sign in" />
        </template>
      </TrustyForm>`,
  }),
}
