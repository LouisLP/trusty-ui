<script setup lang="ts">
// No Reka primitive exists for a file picker, so this is a native `<input type="file">` with the drag-and-drop path hand-wired. The input is the control: it is visually hidden but still focusable, so it takes the field's `id` / `aria-*`, carries `required` natively, and Enter or Space on it opens the picker. The dropzone paints the focus ring for it via `:has()`.
//
// The "Browse files" button and the dropzone's own click are pointer-only duplicates of that one keyboard path, which is why the button is `tabindex="-1"` and hidden from assistive tech — one control, three ways to reach it.
//
// Validation is the consumer's: nothing here checks size, type or count. `accept` only filters the picker, as the platform does; a dropped file that violates it still arrives, and the app decides what that means.

import { computed, ref, useAttrs, useTemplateRef } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import { formatFileSize } from './TrustyFileInput.format'

/**
 * The native `accept` attribute: a comma-separated list of MIME types (`'image/png'`), the three wildcards HTML itself names, or extensions (`'.pdf'`).
 *
 * The union is autocomplete for the three wildcards only; `(string & {})` keeps every other legal value legal. Enumerating concrete types instead would be an allowlist picked from the IANA registry, which goes stale, and a template literal cannot validate a comma-separated list without recursive conditionals that print into the autodocs prop table and reject `'image/*, .pdf'` over the space.
 */
type TrustyFileInputAccept = 'image/*' | 'audio/*' | 'video/*' | (string & {})

// id / aria-describedby etc. fall through onto the focusable <input>.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Accept filter handed to the native picker, e.g. `'image/*,.pdf'`. Does not reject dropped files — that stays the consumer's call. */
  accept?: TrustyFileInputAccept
  /** Accept more than one file. When false, a new pick or drop REPLACES the held file. */
  multiple?: boolean
  /** Muted line under the heading — the accepted types and size ceiling, in the app's own words. */
  description?: string
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}>(), {
  multiple: false,
  disabled: false,
  required: false,
  invalid: false,
})

const model = defineModel<File[]>({ default: () => [] })

// No visible label is rendered, so the input needs a name of its own — but only when nothing else names it. An `id` means TrustyFormItem has a <label for> pointing here, and aria-label would silently beat that label, so the fallback stands down. A caller's own `aria-label` wins too: it lands later, from $attrs.
const attrs = useAttrs()
const fallbackLabel = computed(() =>
  attrs.id || attrs['aria-labelledby'] ? undefined : 'Files')

const input = useTemplateRef<HTMLInputElement>('input')

// Dragging over a child fires dragleave on the parent, so nesting is counted rather than toggled.
const dragDepth = ref(0)
const isDragOver = computed(() => dragDepth.value > 0)

/** Same name, size and mtime is the same file — picking one twice should not add a second row. */
function isSame(a: File, b: File) {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
}

function commit(incoming: FileList | null) {
  const files = Array.from(incoming ?? [])
  if (!files.length)
    return

  model.value = props.multiple
    ? [...model.value, ...files.filter(file => !model.value.some(held => isSame(held, file)))]
    : files.slice(0, 1)
}

function onChange(event: Event) {
  commit((event.target as HTMLInputElement).files)
  // Clear it, or re-picking the same file fires no `change` at all.
  if (input.value)
    input.value.value = ''
}

function onDragEnter() {
  if (!props.disabled)
    dragDepth.value += 1
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

function onDragOver(event: DragEvent) {
  // Without this the browser refuses the drop.
  event.preventDefault()
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = props.disabled ? 'none' : 'copy'
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  dragDepth.value = 0
  if (!props.disabled)
    commit(event.dataTransfer?.files ?? null)
}

function browse() {
  if (!props.disabled)
    input.value?.click()
}

function remove(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="trusty-file-input">
    <!-- eslint-disable-next-line vue-a11y/no-static-element-interactions -- pointer-only convenience; the keyboard path is the labelled <input> inside -->
    <div
      class="trusty-file-input-dropzone"
      :data-drag-over="isDragOver || undefined"
      :data-invalid="invalid || undefined"
      :data-disabled="disabled || undefined"
      @click="browse"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <input
        ref="input"
        :aria-label="fallbackLabel"
        v-bind="$attrs"
        type="file"
        class="trusty-file-input-native"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        :required="required"
        :aria-invalid="invalid || undefined"
        @change="onChange"
        @click.stop
      >

      <p class="trusty-file-input-heading">
        Drop files here
      </p>
      <p
        v-if="description"
        class="trusty-file-input-description"
      >
        {{ description }}
      </p>

      <!-- Pointer-only twin of the input's own keyboard path, so it takes neither a tab stop nor a second line in the a11y tree. -->
      <button
        type="button"
        class="trusty-file-input-browse"
        tabindex="-1"
        aria-hidden="true"
        :disabled="disabled"
      >
        Browse files
      </button>
    </div>

    <ul
      v-if="model.length"
      class="trusty-file-input-files"
    >
      <li
        v-for="(file, index) in model"
        :key="`${file.name}-${file.size}-${file.lastModified}`"
        class="trusty-file-input-file"
      >
        <span class="trusty-file-input-avatar">
          <TrustyIcon name="ph:file" />
        </span>

        <span class="trusty-file-input-meta">
          <span class="trusty-file-input-name">{{ file.name }}</span>
          <span class="trusty-file-input-size">{{ formatFileSize(file.size) }}</span>
        </span>

        <button
          type="button"
          class="trusty-file-input-remove"
          :disabled="disabled"
          :aria-label="`Remove ${file.name}`"
          @click="remove(index)"
        >
          <TrustyIcon name="ph:x" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.trusty-file-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  box-sizing: border-box;
  inline-size: 100%;
}

/* ── the dropzone ── */
.trusty-file-input-dropzone {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: var(--size-control-xl);
  max-block-size: var(--size-2xs);
  padding: var(--space-xl);
  cursor: pointer;
  border: var(--border-md) dashed var(--color-border-highlight);
  border-radius: var(--radius-md);
  transition:
    background-color var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out;
}

.trusty-file-input-dropzone:hover:not([data-disabled], [data-invalid], [data-drag-over]) {
  border-color: var(--color-text-muted);
}

/* The wash is TrustyButton's ghost recipe restated (ADR 0002) */
.trusty-file-input-dropzone[data-drag-over] {
  background-color: var(--color-ghost-surface-subtle);
  border-color: var(--color-primary-highlight);
}

.trusty-file-input-dropzone[data-invalid] {
  border-color: var(--color-border-danger);
}

.trusty-file-input-dropzone[data-disabled] {
  cursor: not-allowed;
  background-color: var(--color-bg-inset-muted);
  border-color: var(--color-border);
}

/* The ring lives here because the input that owns the focus is out of sight. */
.trusty-file-input-dropzone:has(.trusty-file-input-native:focus-visible) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

/* Focusable, so it can be the control; invisible, so the dropzone is what you see. Its `@click.stop` is load-bearing: `input.click()` bubbles back into the dropzone's click handler, which would call it again forever. */
.trusty-file-input-native {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}

.trusty-file-input-heading {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  text-align: center;
}

.trusty-file-input-description {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
  text-align: center;
}

.trusty-file-input-dropzone[data-disabled] .trusty-file-input-heading,
.trusty-file-input-dropzone[data-disabled] .trusty-file-input-description {
  color: var(--color-text-muted);
}

/* The secondary-button recipe, restated (ADR 0002) rather than reaching for TrustyButton, which would make this control `specialized`. */
.trusty-file-input-browse {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  min-block-size: var(--size-control-sm);
  margin-block-start: var(--space-sm);
  padding-block: var(--space-2xs);
  padding-inline: var(--space-sm);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  color: var(--color-text);
  white-space: nowrap;
  cursor: inherit;
  background-color: var(--color-secondary);
  border: none;
  border-radius: var(--radius-xs);
  transition: background-color var(--duration-fast) ease-out;
}

.trusty-file-input-dropzone:hover .trusty-file-input-browse:not(:disabled) {
  background-color: var(--color-secondary-muted);
}

.trusty-file-input-browse:disabled {
  color: var(--color-text-muted);
}

/* ── the held files ── */
.trusty-file-input-files {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin: 0;
  padding: 0;
  list-style: none;
}

.trusty-file-input-file {
  /* A 6px avatar gap has no step on the spacing scale; 8px is the nearest. */
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  box-sizing: border-box;
  min-block-size: var(--size-control-xl);
  padding: var(--space-sm);
  border: var(--border-sm) solid var(--color-border);
  border-radius: var(--radius-md);
}

.trusty-file-input-avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--size-control-md);
  block-size: var(--size-control-md);

  /* 18px glyph, matching TrustySearchInput / TrustySecretInput / NumberFieldBase. */
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  background-color: var(--color-bg-elevated);
  border-radius: var(--radius-full);
}

.trusty-file-input-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-inline-size: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
}

.trusty-file-input-name {
  overflow: hidden;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trusty-file-input-size {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.trusty-file-input-remove {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--size-control-md);
  block-size: var(--size-control-md);
  padding: var(--space-xs);
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--radius-xs);
  transition: color var(--duration-fast) ease-out;
}

.trusty-file-input-remove:hover:not(:disabled) {
  color: var(--color-text);
}

.trusty-file-input-remove:focus {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-file-input-remove:focus:not(:focus-visible) {
  outline-color: transparent;
}

.trusty-file-input-remove:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .trusty-file-input-dropzone,
  .trusty-file-input-browse,
  .trusty-file-input-remove {
    transition: none;
  }
}
</style>
