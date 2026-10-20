/**
 * The Vue half of the CodeMirror lifecycle, shared by the two SFCs that mount an editing surface: the content attributes, the async mount, the teardown, and the watchers that push prop changes back through the handle. `editor-host.ts` is the CodeMirror half.
 *
 * IMPORTANT — this file must never import `@codemirror/*`, directly or through `editor-host.ts`. The SFCs import it statically, so anything it pulls in lands in the main bundle, and ADR 0001 requires CodeMirror to stay in a lazily-loaded chunk. The surface's own module is reached through the `create` callback, where the `await import()` lives; `import type` is safe, a value import is not.
 */

import type { ComputedRef, MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { computed, onBeforeUnmount, onMounted, toValue, useAttrs, watch } from 'vue'

/** What `useEditorHost` needs a surface's handle to be able to do. */
export interface EditorSurfaceHandle {
  setDoc: (doc: string) => void
  setEditable: (editable: boolean) => void
  setContentAttributes: (attributes: Record<string, string>) => void
  focus: () => void
  destroy: () => void
}

/** The lifecycle-shaped part of a surface's options, filled in by the composable. */
export interface EditorSurfaceConfig {
  parent: HTMLElement
  doc: string
  editable: boolean
  contentAttributes: Record<string, string>
  onChange: (doc: string) => void
}

export interface UseEditorHostOptions<Handle extends EditorSurfaceHandle> {
  /** The element CodeMirror attaches into. */
  host: Readonly<ShallowRef<HTMLElement | null>>
  /** The v-model. Source of truth in both directions. */
  model: Ref<string>
  disabled: MaybeRefOrGetter<boolean>
  /** Advisory only: the editable element is a contenteditable (ADR 0001). */
  required: MaybeRefOrGetter<boolean>
  invalid: MaybeRefOrGetter<boolean>
  /** Take focus once CodeMirror attaches. Not page-load autofocus: CodeMirror arrives asynchronously, so a host that opens the editor on a user action has nothing to focus when it renders. */
  focusOnAttach?: MaybeRefOrGetter<boolean>
  /** Dynamically import the surface's editor module and create it. The `await import()` belongs here — see the note at the top of this file. */
  create: (config: EditorSurfaceConfig) => Promise<Handle>
}

export interface UseEditorHostResult<Handle extends EditorSurfaceHandle> {
  /** The handle, once attached. Undefined before the chunk lands. */
  editor: () => Handle | undefined
  /** Fall-through attrs that did NOT go onto the textbox: class, style, data-*. */
  rootAttributes: ComputedRef<Record<string, unknown>>
  /** Move focus into the editor. Safe before it attaches. */
  focus: () => void
}

export function useEditorHost<Handle extends EditorSurfaceHandle>(
  options: UseEditorHostOptions<Handle>,
): UseEditorHostResult<Handle> {
  const attrs = useAttrs()
  let editor: Handle | undefined

  /* CodeMirror renders the editable element, so labelling attributes are pushed onto it rather than left to fall through the template — this is how TrustyFormItem's `id` and `aria-describedby` reach the textbox. */
  const contentAttributes = computed(() => {
    const forwarded: Record<string, string> = {}
    for (const [key, value] of Object.entries(attrs)) {
      if ((key === 'id' || key.startsWith('aria-')) && value != null) {
        forwarded[key] = String(value)
      }
    }
    if (toValue(options.required)) {
      forwarded['aria-required'] = 'true'
    }
    if (toValue(options.invalid)) {
      forwarded['aria-invalid'] = 'true'
    }
    return forwarded
  })

  // Everything not forwarded to the textbox stays on the root (class, style, data-*).
  const rootAttributes = computed(() =>
    Object.fromEntries(Object.entries(attrs).filter(([key]) => !(key in contentAttributes.value))))

  onMounted(async () => {
    const parent = options.host.value
    if (!parent) {
      return
    }

    const created = await options.create({
      parent,
      doc: options.model.value,
      editable: !toValue(options.disabled),
      contentAttributes: contentAttributes.value,
      onChange: (doc) => {
        options.model.value = doc
      },
    })

    // The chunk is in flight across an await, so the component may already be gone by the time it lands, and nothing would ever tear this one down.
    if (!options.host.value) {
      created.destroy()
      return
    }
    editor = created

    if (toValue(options.focusOnAttach)) {
      editor.focus()
    }
  })

  onBeforeUnmount(() => editor?.destroy())

  // The model is the source of truth: an outside change is pushed in, and the editor's own edits already arrived through onChange (setDoc no-ops on equal text, so this never loops).
  watch(options.model, doc => editor?.setDoc(doc))
  watch(() => toValue(options.disabled), disabled => editor?.setEditable(!disabled))
  watch(contentAttributes, next => editor?.setContentAttributes(next))

  return {
    editor: () => editor,
    rootAttributes,
    focus: () => editor?.focus(),
  }
}
