<script setup lang="ts">
// Public markdown field: the private MarkdownToolbar on top of a surface that styles the markdown as it is typed. One control, one value — the markdown source — and no rendered preview, since the styling *is* the preview, so the library needs no markdown-to-HTML renderer.
//
// Three files, three concerns: .markdown.ts  every markdown rule, as pure string functions (Vue-free, CodeMirror-free) .editor.ts    the CodeMirror EditorView (dynamically imported, its own chunk) this file     props, v-model, the toolbar, and the chrome around both
//
// One consequence, the same one TrustyCodeBlock lives with: the editable element is a contenteditable, so `required` is advisory (aria-required) and the value does not participate in native form submission.

import type { MarkdownToolbarAction } from '../../private/MarkdownToolbar/MarkdownToolbar.actions'
import type { MarkdownEditorHandle } from './TrustyMarkdownEditor.editor'
import { ref, useTemplateRef } from 'vue'
import { useEditorHost } from '../../../internal/codemirror/useEditorHost'
import MarkdownToolbar from '../../private/MarkdownToolbar/MarkdownToolbar.vue'

const props = withDefaults(defineProps<{
  /** Shown while the field is empty. */
  placeholder?: string
  /** Lines the text area is tall before it grows with its content. */
  rows?: number
  /** Lines it grows to before it scrolls instead, in the editor's own scroller — CodeMirror measures the viewport against its own element, so it cannot be wrapped in a `TrustyScrollArea`. */
  maxRows?: number
  disabled?: boolean
  /** Marks the field required (advisory: `aria-required`). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  placeholder: undefined,
  rows: 6,
  maxRows: 20,
  disabled: false,
  required: false,
  invalid: false,
})

/** The markdown source, verbatim. */
const model = defineModel<string>({ default: '' })

const host = useTemplateRef<HTMLElement>('host')

/** Which formats apply where the caret sits, and whether there is a selection to link. The toolbar holds no state of its own, so this is the only thing that presses its segments. */
const active = ref<MarkdownToolbarAction[]>([])
const hasSelection = ref(false)

// Mount, teardown, the attribute split and the model/disabled watchers are the shared CodeMirror lifecycle. What stays here is what only a markdown field has: the toolbar and what drives it.
const { editor, rootAttributes, focus } = useEditorHost<MarkdownEditorHandle>({
  host,
  model,
  disabled: () => props.disabled,
  required: () => props.required,
  invalid: () => props.invalid,
  create: async (config) => {
    const { createMarkdownEditor } = await import('./TrustyMarkdownEditor.editor')
    return createMarkdownEditor({
      ...config,
      placeholder: props.placeholder,
      onContext: (context) => {
        active.value = context.active
        hasSelection.value = context.hasSelection
      },
    })
  },
})

function onSelect(action: MarkdownToolbarAction) {
  // The bar reports `link` only through its own popover, which arrives with a URL; there is nothing to apply without one.
  if (action !== 'link') {
    editor()?.applyAction(action)
  }
}

/** Move focus into the text. */
defineExpose({ focus })
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <div
    class="trusty-markdown-editor"
    :style="{ '--markdown-editor-rows': rows, '--markdown-editor-max-rows': maxRows }"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
    v-bind="rootAttributes"
  >
    <!-- mousedown is swallowed so a click on the bar never takes focus off the text: the selection the press is about to format has to survive it. Tabbing to the bar still works. -->
    <MarkdownToolbar
      class="trusty-markdown-editor-toolbar"
      :active="active"
      :disabled="disabled"
      :link-disabled="!hasSelection"
      @mousedown.prevent
      @select="onSelect"
      @link="url => editor()?.insertLink(url)"
    />

    <div
      ref="host"
      class="trusty-markdown-editor-surface"
    />
  </div>
</template>

<style scoped>
/* The bar is chrome, not part of the textbox: it sits outside the text area's frame, so hovering or focusing the field lights the text area alone. The wrapper carries no border for the same reason. */
.trusty-markdown-editor {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
}

/* The bar brings its own top rounding, so it needs nothing here but its place in the column. */
.trusty-markdown-editor-toolbar {
  flex: none;
}

/* The textbox, and the only thing that carries the control's states. The bar supplies its top edge, so only the bottom corners round. */
.trusty-markdown-editor-surface {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  background-color: var(--color-secondary);
  border: var(--border-md) solid var(--color-border);
  border-end-start-radius: var(--radius-xs);
  border-end-end-radius: var(--radius-xs);
  transition: border-color var(--duration-fast) ease-out;
}

.trusty-markdown-editor-surface:hover:not([data-disabled], :focus-within) {
  border-color: var(--color-text-muted);
}

/* The border IS the focus ring (no extra outline), matching TextInputBase and CodeEditorBase. */
.trusty-markdown-editor-surface:focus-within {
  border-color: var(--color-primary-highlight);
}

.trusty-markdown-editor[data-invalid] .trusty-markdown-editor-surface {
  border-color: var(--color-border-danger);
}

/* Disabled paints muted surfaces (no opacity — the colours carry the state). */
.trusty-markdown-editor[data-disabled] .trusty-markdown-editor-surface {
  color: var(--color-text-muted);
  cursor: not-allowed;
  background-color: var(--color-secondary-muted);
}

/* CodeMirror's DOM never carries Vue's scope attribute, so its metrics and colours are set through the theme facet in TrustyMarkdownEditor.theme.ts. What is left here is the box it lives in — and the editor has to *be* that box rather than sit at the top of it, or a click below the first line lands on a wrapper the editor does not own and the field never takes focus.

   `1lh` resolves against the font the theme sets here, so both bounds are in real lines of text. A row at a block edge carries half a gap as well, so a field holds slightly fewer lines than it counts once the text has breaks in it. */
:deep(.cm-editor) {
  flex: 1;
  inline-size: 100%;
  min-block-size: calc(var(--markdown-editor-rows) * 1lh + 2 * var(--space-xs));
  max-block-size: calc(var(--markdown-editor-max-rows) * 1lh + 2 * var(--space-xs));
}

@media (prefers-reduced-motion: reduce) {
  .trusty-markdown-editor-surface {
    transition: none;
  }
}
</style>
