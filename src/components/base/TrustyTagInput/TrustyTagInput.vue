<script setup lang="ts">
// REFERENCE: https://reka-ui.com/docs/components/tags-input
//
// The chips are not TrustyTag: a chip has to BE TagsInputItem and its × has to BE TagsInputItemDelete, which bridging would need `asChild`. So the chip recipe is restated below, per ADR 0002 — colours still come from the one hue token.
//
// Every chip is blue until a colour selector exists, so the value stays a plain string[].

import {
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
  TagsInputRoot,
} from 'reka-ui'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

// id / aria-describedby etc. fall through onto the focusable <input>.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  /** Shown in the input while it is empty. */
  placeholder?: string
  /** Accessible name for the input (no visible label is rendered). */
  ariaLabel?: string
  /** Disable the WHOLE control — every chip's delete button included. */
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
  /** Cap on how many tags can be committed. 0 means no cap. */
  max?: number
}>(), {
  placeholder: 'Enter tag name…',
  disabled: false,
  required: false,
  invalid: false,
  max: 0,
})

const model = defineModel<string[]>({ default: () => [] })
</script>

<template>
  <TagsInputRoot
    v-model="model"
    :disabled="disabled"
    :aria-disabled="disabled || undefined"
    :max="max"
    :required="required || undefined"
    :add-on-paste="true"
    class="trusty-tag-input"
    :data-field-invalid="invalid || undefined"
  >
    <div
      v-if="model.length"
      class="trusty-tag-input-tags"
    >
      <TagsInputItem
        v-for="tag in model"
        :key="tag"
        :value="tag"
        class="trusty-tag-input-tag"
      >
        <TagsInputItemText class="trusty-tag-input-tag-label" />
        <!-- No aria-label: Reka applies aria-labelledby → the chip's text after our props, so one would be silently dropped. tabindex="-1" is Reka's too — a chip is reached with ← / → and dropped with Backspace. -->
        <TagsInputItemDelete class="trusty-tag-input-tag-delete">
          <TrustyIcon
            name="ph:x"
            size="sm"
          />
        </TagsInputItemDelete>
      </TagsInputItem>
    </div>

    <TagsInputInput
      v-bind="$attrs"
      class="trusty-tag-input-field"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :aria-invalid="invalid || undefined"
      :aria-required="required || undefined"
    />
  </TagsInputRoot>
</template>

<style scoped>
.trusty-tag-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: var(--size-control-md);
  padding: var(--space-sm);
  background-color: var(--color-bg-inset);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  transition: border-color var(--duration-fast) ease-out;
}

.trusty-tag-input:hover:not([data-disabled], :focus-within) {
  border-color: var(--color-border-highlight);
}

/* The border IS the focus ring, on the shell so chips and input read as one field. */
.trusty-tag-input:focus-within {
  border-color: var(--color-primary-highlight);
}

/* Not `data-invalid`: TagsInputRoot binds its own as an explicit prop, which beats ours, and it means "the entry you just typed was refused" instead. */
.trusty-tag-input[data-field-invalid] {
  border-color: var(--color-border-danger);
}

.trusty-tag-input[data-disabled] {
  cursor: not-allowed;
  background-color: var(--color-bg-inset-muted);
  border-color: var(--color-border);
}

.trusty-tag-input-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: flex-start;
}

.trusty-tag-input-tag {
  --trusty-tag-input-hue: var(--color-tag-blue);

  display: inline-flex;
  gap: var(--space-xs);
  align-items: center;
  box-sizing: border-box;
  min-block-size: var(--size-control-sm);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  color: var(--color-text-toned);
  background-color: color-mix(in srgb, var(--trusty-tag-input-hue) 24%, transparent);
  border-radius: var(--radius-sm);
}

/* data-state="active" is the chip the arrow keys have walked to. */
.trusty-tag-input-tag[data-state='active'] {
  box-shadow: inset 0 0 0 var(--border-md) var(--trusty-tag-input-hue);
}

.trusty-tag-input[data-disabled] .trusty-tag-input-tag {
  color: var(--color-text-muted);
}

.trusty-tag-input-tag-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trusty-tag-input-tag-delete {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
}

.trusty-tag-input-tag-delete:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-tag-input-tag-delete:focus:not(:focus-visible) {
  outline-color: transparent;
}

.trusty-tag-input[data-disabled] .trusty-tag-input-tag-delete {
  cursor: not-allowed;
}

.trusty-tag-input-field {
  box-sizing: border-box;
  min-inline-size: 0;
  padding: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  appearance: none;
  /* stylelint-disable-next-line a11y/no-outline-none -- ring lives on the shell */
  outline: none;
  background-color: transparent;
  border: none;
}

.trusty-tag-input-field::placeholder {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

.trusty-tag-input-field:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* Reka's own data-invalid: the pending entry was refused. Tint the text, not the shell — what was refused is the value the user still holds. */
.trusty-tag-input-field[data-invalid] {
  color: var(--color-danger-text);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-tag-input {
    transition: none;
  }
}
</style>
