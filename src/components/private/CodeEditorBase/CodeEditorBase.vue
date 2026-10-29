<script setup lang="ts">
// PRIVATE primitive — NOT exported from the library. Owns the editable code surface and nothing around it: no header, no language label, no edit/save affordance. TrustyCodeBlock composes it as its edit mode and owns that lifecycle, which is why this carries no chrome it would have to fight.
//
// The colours come from the same Shiki highlighter, grammars and theme TrustyCodeBlock renders in its read mode (src/internal/code-highlight via CodeEditorBase.shiki.ts), so switching between the two recolours nothing.
//
// CodeMirror is imported dynamically (CodeEditorBase.editor.ts): it lands in its own chunk, so a consumer that never opens an editor never ships it, and the component renders its shell before the editor attaches.
//
// One consequence of not being a <textarea>: the editable element is a contenteditable, so `required` is advisory (aria-required) and the value does not participate in native form submission — the v-model is the value, which is already how every Trusty UI form works.

import type { TrustyCodeLanguage } from '../../../internal/code-highlight'
import type { CodeEditorHandle } from './CodeEditorBase.editor'
import { useTemplateRef, watch } from 'vue'
import { useEditorHost } from '../../../internal/codemirror/useEditorHost'

const props = withDefaults(defineProps<{
  /** Grammar used to highlight the code. Omit for plain text. */
  language?: TrustyCodeLanguage
  /** Show the line-number gutter. */
  lineNumbers?: boolean
  /** Shown while the editor is empty. */
  placeholder?: string
  /** Take focus once CodeMirror attaches. Not page-load autofocus: the host sets this when the *user* opens the editor, and CodeMirror arrives asynchronously, so the host has nothing to focus at the moment it renders this. */
  focusOnAttach?: boolean
  disabled?: boolean
  /** Marks the field required (advisory: `aria-required`). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  language: undefined,
  lineNumbers: true,
  placeholder: undefined,
  focusOnAttach: false,
  disabled: false,
  required: false,
  invalid: false,
})

const model = defineModel<string>({ default: '' })

const host = useTemplateRef<HTMLElement>('host')

// Mount, teardown, the content/root attribute split and the model + disabled watchers are the CodeMirror lifecycle, shared with TrustyMarkdownEditor. What stays here is what only a code field has: the grammar and the gutter.
const { editor, rootAttributes, focus } = useEditorHost<CodeEditorHandle>({
  host,
  model,
  disabled: () => props.disabled,
  required: () => props.required,
  invalid: () => props.invalid,
  focusOnAttach: () => props.focusOnAttach,
  create: async (config) => {
    const { createCodeEditor } = await import('./CodeEditorBase.editor')
    return createCodeEditor({
      ...config,
      language: props.language,
      lineNumbers: props.lineNumbers,
      placeholder: props.placeholder,
    })
  },
})

watch(() => props.language, language => editor()?.setLanguage(language))
watch(() => props.lineNumbers, enabled => editor()?.setLineNumbers(enabled))

/** Move focus into the code. */
defineExpose({ focus })
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <div
    class="code-editor-base"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
    v-bind="rootAttributes"
  >
    <div
      ref="host"
      class="code-editor-base-host"
    />
  </div>
</template>

<style scoped>
/* One framed surface: nothing supplies an edge for it, so the border runs the whole way round and the focus ring lights all four sides, unlike the read view whose top edge is the header's. CodeMirror sizes itself to its content, so this grows with the code until the host constrains it and CodeMirror's own scroller takes over. */
.code-editor-base {
  display: flex;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
  background-color: var(--color-bg-inset);
  border: var(--border-md) solid var(--color-border);
  border-radius: var(--radius-xs);
  transition: border-color var(--duration-fast) ease-out;
}

.code-editor-base:hover:not([data-disabled], :focus-within) {
  border-color: var(--color-text-muted);
}

/* The border IS the focus ring (no extra outline), on the wrapper so the whole surface is framed as one — matching TextInputBase. */
.code-editor-base:focus-within {
  border-color: var(--color-primary-highlight);
}

.code-editor-base[data-invalid] {
  border-color: var(--color-border-danger);
}

/* Disabled paints muted surfaces (no opacity — the colours carry the state). */
.code-editor-base[data-disabled] {
  cursor: not-allowed;
  background-color: var(--color-bg-inset-muted);
}

.code-editor-base[data-disabled] .code-editor-base-host {
  color: var(--color-text-muted);
}

/* Holds CodeMirror. One line tall before the editor attaches (and while empty), so the shell doesn't collapse and then jump. */
.code-editor-base-host {
  flex: 1;
  min-inline-size: 0;
  min-block-size: calc(1lh + 2 * var(--space-xs));
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}

/* CodeMirror's own DOM never carries Vue's scope attribute, so its metrics and colours are set through the theme facet in CodeEditorBase.editor.ts. Only the element we hand it is styled here — via :deep for the wrapper it adds. */
:deep(.cm-editor) {
  inline-size: 100%;
  block-size: 100%;
}

@media (prefers-reduced-motion: reduce) {
  .code-editor-base {
    transition: none;
  }
}
</style>
