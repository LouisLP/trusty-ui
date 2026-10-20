/** Numeric props shared by NumberFieldBase and TrustyNumberField, its public wrapper. Single source of truth so the wrapper forwards the numeric API without re-declaring it. */
export interface NumberFieldBaseProps {
  min?: number
  max?: number
  /** Stepper/arrow-key increment. Defaults to `10^-precision` when `precision` is set, else 1. */
  step?: number
  placeholder?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  precision?: number
  /** Unit shown after the value (e.g. 'mm', '°', 'rad'). Decorative — also name the unit in the field's label/hint for assistive tech. */
  unit?: string
  /** Intl.NumberFormat options, e.g. `{ style: 'currency', currency: 'EUR' }`. Wins over `precision`. */
  formatOptions?: Intl.NumberFormatOptions
  /** Opt-in +/- stepper buttons. Off by default (bare type-only field). */
  steppers?: boolean
  /** Blocks manual (typed) entry only — the value can still be stepped via the +/- buttons, and the input stays focusable so arrow keys / scroll keep stepping too (it renders `readonly`, not `disabled`). Pair with `steppers`; `disabled` switches off the whole control instead. */
  inputDisabled?: boolean
}
