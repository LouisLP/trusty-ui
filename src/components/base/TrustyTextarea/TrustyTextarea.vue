<script setup lang="ts">
// Public multi-line text field. A layer-1 control: no label and no error text of its own. Reka UI has no textarea primitive and needs none — a native <textarea> already carries the role, the value, and the whole editing keymap — so this component IS the <textarea>, which is also why $attrs (id, aria-describedby, maxlength, name, …) land on the focusable element without an inheritAttrs dance. That relies on the build stripping the eslint comment below (tsdown.config.ts); kept, it makes the root a Fragment and a production build drops the attrs.

withDefaults(defineProps<{
  placeholder?: string
  /** Visible lines at rest, which is what sets the field's height. The default 3 is the design's 72px box. With `autoGrow` it becomes the minimum instead. */
  rows?: number
  /** Grow with the value instead of scrolling, via `field-sizing: content`. `rows` stays the floor. Browsers without `field-sizing` keep the fixed `rows` height and scroll — the value is never clipped, so this degrades rather than breaks. */
  autoGrow?: boolean
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  rows: 3,
  autoGrow: false,
  disabled: false,
  required: false,
  invalid: false,
})

const model = defineModel<string>({ default: '' })
</script>

<template>
  <!-- eslint-disable-next-line vue-a11y/form-control-has-label -->
  <textarea
    v-model="model"
    class="trusty-textarea"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled || undefined"
    :required="required || undefined"
    :aria-invalid="invalid || undefined"
    :data-invalid="invalid || undefined"
    :data-auto-grow="autoGrow || undefined"
  />
</template>

<style scoped>
.trusty-textarea {
  /* Pin box-sizing: the UA stylesheet makes textarea content-box in some engines, so padding would otherwise count on top of the `rows` height and the box would no longer be 3 lines tall. Matches TextInputBase. */
  box-sizing: border-box;
  inline-size: 100%;

  /* Vertical only: a textarea that can be dragged wider escapes the form column it sits in. */
  resize: vertical;

  /* The floor the drag stops at. Without it the handle shrinks the field to a couple of pixels, hiding the value; `rows` is the resting height, not a limit. One single-line control is the honest minimum — 2rem holds exactly one line once the padding and border are counted, so a dragged-down textarea bottoms out looking like a TrustyTextInput rather than a slot. */
  min-block-size: var(--size-control-md);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-toned);
  appearance: none;
  background-color: var(--color-bg-inset);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);

  /* The design's slim bars. A native <textarea> scrolls its own content, so TrustyScrollArea cannot wrap it — same approach as the CodeMirror surfaces. */
  scrollbar-width: thin;
  scrollbar-color: var(--color-text-muted) transparent;
  transition: border-color var(--duration-fast) ease-out;
}

/* Grow with the content; `rows` becomes the minimum. `resize` would fight the automatic height, so it goes. */
.trusty-textarea[data-auto-grow] {
  field-sizing: content;
  resize: none;
}

/* Hover only hints while unfocused — focus (below) owns the border once the field has it, so hovering a focused field doesn't drop back to gray. */
.trusty-textarea:hover:not(:disabled, :focus) {
  border-color: var(--color-border-highlight);
}

/* The border IS the focus ring (no extra outline), and it answers plain :focus rather than :focus-visible: a click into a textarea starts an editing session, so the frame has to show however focus arrived. */
/* stylelint-disable-next-line a11y/no-outline-none */
.trusty-textarea:focus {
  border-color: var(--color-primary-highlight);
  outline: none;
}

.trusty-textarea[data-invalid] {
  border-color: var(--color-border-danger);
}

.trusty-textarea::placeholder {
  color: var(--color-text-muted);
}

/* Disabled paints muted surfaces (no opacity — the colours carry the state). */
.trusty-textarea:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
  background-color: var(--color-bg-inset-muted);
  border-color: var(--color-border);
}

@media (prefers-reduced-motion: reduce) {
  .trusty-textarea {
    transition: none;
  }
}
</style>
