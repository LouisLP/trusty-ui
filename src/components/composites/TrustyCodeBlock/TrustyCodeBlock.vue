<script setup lang="ts">
import type { TrustyCodeLanguage } from '../../../internal/code-highlight'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watchEffect } from 'vue'
import { copyText } from '../../../internal/clipboard'
import TrustyButton from '../../base/TrustyButton/TrustyButton.vue'
import TrustyScrollArea from '../../base/TrustyScrollArea/TrustyScrollArea.vue'
import TrustySelect from '../../base/TrustySelect/TrustySelect.vue'
import TrustyTooltip from '../../base/TrustyTooltip/TrustyTooltip.vue'
import CodeEditorBase from '../../private/CodeEditorBase/CodeEditorBase.vue'

withDefaults(defineProps<{
  /** Show the line-number gutter. */
  lineNumbers?: boolean
  /** Show the copy-to-clipboard button in the header. */
  copyable?: boolean
  /** Offer an Edit button in the header, swapping the code for an editor. */
  editable?: boolean
  /** Shown while the editor is empty (edit mode only). */
  placeholder?: string
}>(), {
  lineNumbers: true,
  copyable: true,
  editable: false,
  placeholder: undefined,
})

const emit = defineEmits<{
  /** Fired when Save is pressed, with the edited code and the picked language. */
  submit: [code: string, language: TrustyCodeLanguage]
}>()

/** The code, verbatim. A plain `:code` binding is enough — Save still updates what's displayed — while `v-model:code` also writes the edit back to the consumer's own state. */
const code = defineModel<string>('code', { default: '' })

/** Language shown in the header and used for syntax highlighting; omit for plain text. While editing, the header turns it into a picker (JSON when unset), and Save commits the pick the same way it commits the code. */
const language = defineModel<TrustyCodeLanguage>('language')

// Record forces a label per language; type-only import keeps Shiki lazy.
const LANGUAGE_LABELS: Record<TrustyCodeLanguage, string> = {
  json: 'JSON',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
}

const DEFAULT_LANGUAGE: TrustyCodeLanguage = 'json'

const languageItems = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))

function isCodeLanguage(value: string | undefined): value is TrustyCodeLanguage {
  return value !== undefined && Object.hasOwn(LANGUAGE_LABELS, value)
}

const lineCount = computed(() => code.value.split('\n').length)

const gutterNumbers = computed(() =>
  Array.from({ length: lineCount.value }, (_, index) => index + 1).join('\n'))

/* ── edit mode ── The draft is local until Save, so abandoning an edit costs the consumer nothing and never emits. Read mode is the only mode when `editable` is off. */
const editing = ref(false)
const draft = ref('')
const draftLanguage = ref<TrustyCodeLanguage>(DEFAULT_LANGUAGE)

// TrustySelect's model is a plain string.
function pickLanguage(value: string | undefined) {
  if (isCodeLanguage(value))
    draftLanguage.value = value
}

// Only one action button exists at a time, so both share this ref.
const action = useTemplateRef<{ $el?: HTMLElement }>('action')

function startEditing() {
  draft.value = code.value
  draftLanguage.value = language.value ?? DEFAULT_LANGUAGE
  editing.value = true
  // The editor focuses itself as it attaches (see CodeEditorBase's autofocus): CodeMirror arrives asynchronously, so there is nothing here to focus yet.
}

async function save() {
  code.value = draft.value
  language.value = draftLanguage.value
  editing.value = false
  emit('submit', draft.value, draftLanguage.value)

  // Save unmounts the button that was just pressed, so focus has to be handed to the Edit button that replaces it rather than dropped to the document.
  await nextTick()
  action.value?.$el?.focus()
}

// Copy takes what's on screen, which while editing is the draft.
const displayedCode = computed(() => editing.value ? draft.value : code.value)

// Shiki (and the grammar) load lazily on first highlight; until then — and for language-less blocks — the code renders as plain text. The highlighter itself is shared with CodeEditorBase (src/internal/code-highlight), so crossing into edit mode loads it once.
const highlightedCode = ref<string>()

watchEffect(async () => {
  const currentLanguage = language.value
  const currentCode = code.value
  if (!currentLanguage || editing.value) {
    highlightedCode.value = undefined
    return
  }
  try {
    const { highlightToHtml } = await import('../../../internal/code-highlight')
    const html = await highlightToHtml(currentCode, currentLanguage)
    // Guard against a stale async result after the props changed mid-flight.
    if (currentCode === code.value && currentLanguage === language.value) {
      highlightedCode.value = html
    }
  }
  catch {
    highlightedCode.value = undefined
  }
})

// Copy feedback: swap the icon/tooltip to "copied" and announce it, then fall back to the resting state so the button can be used again.
const COPIED_RESET_MS = 2000
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  // Best-effort: a browser that refuses both routes leaves the button resting rather than claiming a copy that never happened.
  if (!await copyText(displayedCode.value))
    return

  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, COPIED_RESET_MS)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <div class="trusty-code-block">
    <div class="trusty-code-block-header">
      <!-- Opens only on click, so focus stays in the editor. -->
      <TrustySelect
        v-if="editing"
        :model-value="draftLanguage"
        variant="ghost"
        :items="languageItems"
        aria-label="Code language"
        class="trusty-code-block-language-select"
        @update:model-value="pickLanguage"
      />
      <span
        v-else
        class="trusty-code-block-language"
      >{{ language && LANGUAGE_LABELS[language] }}</span>

      <TrustyTooltip
        v-if="copyable"
        :text="copied ? 'Copied to clipboard' : 'Copy to clipboard'"
      >
        <TrustyButton
          variant="ghost"
          size="sm"
          :icon="copied ? 'ph:check' : 'ph:copy'"
          aria-label="Copy code to clipboard"
          @click="copy"
        />
      </TrustyTooltip>

      <!-- Save replaces Edit while editing: one slot in the header, one action at a time, so the primary affordance is never ambiguous. -->
      <TrustyButton
        v-if="editable && !editing"
        ref="action"
        variant="ghost"
        size="sm"
        label="Edit"
        class="trusty-code-block-action"
        @click="startEditing"
      />
      <TrustyButton
        v-if="editable && editing"
        ref="action"
        variant="primary"
        size="sm"
        label="Save"
        class="trusty-code-block-action"
        @click="save"
      />
      <!-- The tooltip swap is visual only — announce the copy for screen readers. -->
      <span
        v-if="copyable"
        class="trusty-code-block-announce"
        aria-live="polite"
      >
        {{ copied ? 'Copied to clipboard' : '' }}
      </span>
    </div>

    <CodeEditorBase
      v-if="editing"
      v-model="draft"
      class="trusty-code-block-editor"
      :language="draftLanguage"
      :line-numbers="lineNumbers"
      :placeholder="placeholder"
      :focus-on-attach="true"
    />

    <div
      v-else
      class="trusty-code-block-content"
    >
      <TrustyScrollArea axis="both">
        <div class="trusty-code-block-scroll">
          <!-- Generated from the code itself, so it's redundant for screen readers. -->
          <pre
            v-if="lineNumbers"
            class="trusty-code-block-gutter"
            aria-hidden="true"
          >{{ gutterNumbers }}</pre>
          <!-- Shiki output is escaped token markup (src/internal/code-highlight) — safe for v-html. -->
          <!-- eslint-disable vue/no-v-html -->
          <pre class="trusty-code-block-pre"><code
            v-if="highlightedCode"
            v-html="highlightedCode"
          /><code v-else>{{ code }}</code></pre>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </TrustyScrollArea>
    </div>
  </div>
</template>

<style scoped>
/* Read by assistive tech, drawn nowhere. Not Reka's VisuallyHidden: that one sets aria-hidden="true" by default, which hides the text from the very readers it is for. */
.trusty-code-block-announce {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}
.trusty-code-block {
  /* The gutter and the code are two separate blocks, so their line boxes must land on identical offsets. Engines round a fractional line box (19.6px at 14px x 1.4) differently per block, which accumulates into visible drift; rounding the rhythm up to whole pixels removes the only quantity that can disagree. The editor reads the same variable. */
  --code-line-height: var(--line-height-normal);

  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

@supports (line-height: round(up, 1px, 1px)) {
  .trusty-code-block {
    --code-line-height: round(up, calc(var(--font-size-sm) * var(--line-height-normal)), 1px);
  }
}

/* ── header: language label + copy action ── */
.trusty-code-block-header {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  min-block-size: var(--size-control-md);
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  background-color: var(--color-bg-accented);
  border-start-start-radius: var(--radius-sm);
  border-start-end-radius: var(--radius-sm);
}

.trusty-code-block-action {
  flex: none;
}

/* Matches the read-mode label; :deep because TrustySelect has no root element. */
.trusty-code-block-header :deep(.trusty-code-block-language-select) {
  margin-inline-end: auto;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-widest);
}

.trusty-code-block-language {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-widest);
  white-space: nowrap;
}

/* ── content: gutter + code in one 2-axis scroll area ── The header supplies the top edge, so the border wraps the other three sides only. The consumer constrains the height (block-size/max-block-size on the component); flex + min-block-size let the scroll area take over. */
.trusty-code-block-content {
  flex: 1;
  min-block-size: 0;
  overflow: hidden;
  background-color: var(--color-secondary-muted);
  border: var(--border-md) solid var(--color-border);

  border-block-start-color: transparent;
  border-end-start-radius: var(--radius-xs);
  border-end-end-radius: var(--radius-xs);
}

.trusty-code-block-scroll {
  display: flex;
  align-items: stretch;
  inline-size: fit-content;
  min-inline-size: 100%;
}

/* Sticky against horizontal scroll: line numbers stay put while the code pans, and scroll along with it vertically. Opaque bg so code sliding underneath doesn't show through. */
.trusty-code-block-gutter {
  position: sticky;
  inset-inline-start: 0;
  padding-block: var(--space-xs);
  padding-inline: var(--space-xs);
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: var(--code-line-height);
  color: var(--color-text-muted);
  text-align: end;
  user-select: none;
  background-color: var(--color-secondary-muted);
  border-inline-end: var(--border-sm) solid var(--color-border);
}

/* Edit mode drops into the content slot. CodeEditorBase brings its own complete border, so it squares the corners that meet the header rather than doubling the read view's rounding. */
.trusty-code-block-editor {
  flex: 1;
  min-block-size: 0;
  border-start-start-radius: 0;
  border-start-end-radius: 0;
}

.trusty-code-block-pre {
  padding-block: var(--space-xs);
  padding-inline: var(--space-sm);
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  font-variant-ligatures: none;
  line-height: var(--code-line-height);
  color: var(--color-text);
}

/* The UA stylesheet sets `font-family: monospace` on <code> itself, which beats inheritance from the <pre> above — so without this the code renders in the browser's generic mono while the gutter renders in --font-family-mono. Two fonts, two sets of glyph metrics, one pair of columns that must align. */
.trusty-code-block-pre code {
  font: inherit;
}
</style>
