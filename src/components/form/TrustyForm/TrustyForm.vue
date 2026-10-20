<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Heading shown above the error summary. */
  summaryTitle?: string
  /** Top-level error messages for the summary box. Pass the current validation errors; an empty list hides the summary. Each entry may link to its field via `targetId` (the id you also pass to that control). */
  errors?: (string | { message: string, targetId?: string })[]
}>(), {
  summaryTitle: 'Please fix the following:',
  errors: () => [],
})

const emit = defineEmits<{
  submit: [event: SubmitEvent]
}>()

const normalizedErrors = computed(() =>
  props.errors.map(e => (typeof e === 'string' ? { message: e } : e)),
)

const hasErrors = computed(() => normalizedErrors.value.length > 0)

function onSubmit(event: Event) {
  emit('submit', event as SubmitEvent)
}
</script>

<template>
  <form
    class="trusty-form"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- Summary first so AT users hit it on focus; role=alert announces changes. -->
    <div
      v-if="hasErrors"
      class="trusty-form-summary"
      role="alert"
      aria-labelledby="trusty-form-summary-title"
    >
      <p
        id="trusty-form-summary-title"
        class="trusty-form-summary-title"
      >
        {{ summaryTitle }}
      </p>
      <ul class="trusty-form-summary-list">
        <li
          v-for="(err, i) in normalizedErrors"
          :key="i"
        >
          <a
            v-if="err.targetId"
            :href="`#${err.targetId}`"
            class="trusty-form-summary-link"
          >{{ err.message }}</a>
          <template v-else>
            {{ err.message }}
          </template>
        </li>
      </ul>
    </div>

    <div class="trusty-form-fields">
      <slot />
    </div>

    <div
      v-if="$slots.actions"
      class="trusty-form-actions"
    >
      <slot name="actions" />
    </div>
  </form>
</template>

<style scoped>
.trusty-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.trusty-form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.trusty-form-summary {
  padding: var(--space-md);
  font-family: var(--font-family-sans);
  color: var(--color-danger-text);
  background-color: var(--color-danger-surface-subtle);
  border: var(--border-sm) solid var(--color-border-danger);
  border-radius: var(--radius-sm);
}

.trusty-form-summary-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.trusty-form-summary-list {
  padding-inline-start: var(--space-lg);
  margin: 0;
  margin-block-start: var(--space-xs);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

.trusty-form-summary-link {
  color: inherit;
  text-decoration: underline;
}

.trusty-form-summary-link:focus-visible {
  outline: var(--border-md) solid var(--color-danger-text);
  outline-offset: var(--space-2xs);
}

.trusty-form-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}
</style>
