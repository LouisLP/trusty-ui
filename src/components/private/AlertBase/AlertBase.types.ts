/** Props shared by AlertBase and both public wrappers built on it (TrustyAlert, TrustyBanner). Single source of truth so the wrappers forward an identical API without re-declaring it. */
export type AlertBaseVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertBaseProps {
  /** The headline. Plain string only: keeps every alert on the design system. */
  title: string
  /** Optional secondary line under the title. */
  description?: string
  /** Colour role / severity. */
  variant?: AlertBaseVariant
}
