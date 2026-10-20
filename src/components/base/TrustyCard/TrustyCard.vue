<script setup lang="ts">
// A plain <section>: no behaviour of its own, so no Reka primitive.

import { useId } from 'vue'

defineProps<{
  /** Heading for the group, rendered as an `<h3>`. Omit it for an untitled surface. */
  title?: string
  /** Short prose under the heading, saying what the group holds. */
  description?: string
}>()

// Named by its heading, so a titled card is a jumpable region; an untitled one is no landmark.
const titleId = useId()
</script>

<template>
  <section
    class="trusty-card"
    :aria-labelledby="title ? titleId : undefined"
  >
    <div
      v-if="title || $slots.actions"
      class="trusty-card-header"
    >
      <h3
        v-if="title"
        :id="titleId"
        class="trusty-card-title"
      >
        {{ title }}
      </h3>

      <div
        v-if="$slots.actions"
        class="trusty-card-actions"
      >
        <slot name="actions" />
      </div>
    </div>

    <p
      v-if="description"
      class="trusty-card-description"
    >
      {{ description }}
    </p>

    <slot />
  </section>
</template>

<style scoped>
.trusty-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm);
  font-family: var(--font-family-sans);
  color: var(--color-text);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
}

.trusty-card-header {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.trusty-card-title {
  min-inline-size: 0;
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  overflow-wrap: break-word;
}

/* `auto` not `space-between`: keeps a title-less actions row at the end. */
.trusty-card-actions {
  display: flex;
  flex: none;
  gap: var(--space-xs);
  align-items: center;
  margin-inline-start: auto;
}

.trusty-card-description {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  overflow-wrap: break-word;
}
</style>
