/** The item shape ToastBase renders, shared with the two public components built on it (TrustyToast, TrustyToaster) so both feed the host the same thing. */
import type { AlertBaseVariant } from '../AlertBase/AlertBase.types'

export type { AlertBaseVariant as TrustyToastVariant }

/** One toast in the host's list. `open` is the toast's own presence flag: flipping it to false plays the exit animation, and only then is the item dropped. */
export interface ToastBaseItem {
  id: string
  /** The headline. Plain string only: keeps every toast on the design system. */
  title: string
  /** Optional secondary line under the title. */
  description?: string
  /** Colour role / severity. */
  variant?: AlertBaseVariant
  open: boolean
}
