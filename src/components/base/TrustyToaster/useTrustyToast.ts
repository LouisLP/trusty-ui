import type { ToastBaseItem, TrustyToastVariant } from '../../private/ToastBase/ToastBase.types'
import { readonly, ref } from 'vue'

export interface TrustyToastOptions {
  /** The toast headline. Plain string only: keeps every toast on the design system. */
  title: string
  /** Optional secondary line under the title. */
  description?: string
  /** Colour role / severity of the toast. */
  variant?: TrustyToastVariant
}

// Module-level, not per-instance: the point of the composable is that a store action, an HTTP interceptor or any plain .ts module can raise a toast without a component in scope. One TrustyToaster anywhere in the app renders this queue.
const queue = ref<ToastBaseItem[]>([])

// A dismissed toast stays in the queue until its exit animation has played out (--duration-fast, plus a frame's slack).
const EXIT_MS = 200

let counter = 0

function toast(options: TrustyToastOptions): string {
  const id = `trusty-toast-${++counter}`
  queue.value.push({ ...options, id, open: true })
  return id
}

function dismiss(id: string): void {
  const item = queue.value.find(entry => entry.id === id)
  if (!item?.open)
    return

  item.open = false
  setTimeout(() => {
    queue.value = queue.value.filter(entry => entry.id !== id)
  }, EXIT_MS)
}

function dismissAll(): void {
  // Snapshot the ids: dismiss() only flags the items, so the array is still being iterated when it runs.
  queue.value.map(entry => entry.id).forEach(dismiss)
}

/** Raise toasts from anywhere, including outside a component. Requires exactly one `<TrustyToaster />` mounted in the app. */
export function useTrustyToast() {
  return {
    /** The live queue, in the order it renders. Read-only: use `toast` and `dismiss` to change it. */
    toasts: readonly(queue),
    /** Queue a toast and get its id back, so it can be dismissed early. */
    toast,
    /** Dismiss one toast by id; unknown or already-dismissed ids are a no-op. */
    dismiss,
    /** Dismiss everything currently queued. */
    dismissAll,
  }
}
