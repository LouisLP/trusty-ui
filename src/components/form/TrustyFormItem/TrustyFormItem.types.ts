// The layer-2 → layer-1 contract, as a type.
//
// `TrustyFormItem` hands this object to its default slot; a control spreads it with `v-bind="field"`. The object is deliberately mixed-kind, and that is the whole reason it needs a name:
//
// - `id` / `aria-labelledby` / `aria-describedby` travel as FALLTHROUGH ATTRS
// and must land on the control's focusable element, not on its root. A control therefore sets `inheritAttrs: false` and routes `$attrs` itself.
// - `invalid` / `required` travel as DECLARED PROPS, so a control that does
// not declare them silently degrades them into stray DOM attributes.
//
// `TrustyFormItem.conformance.spec.ts` checks every layer-1 control against this shape, since re-deriving both halves by hand in each control is how a control comes to land `id` on its outer `<label>`.

/** The object `TrustyFormItem` exposes on its default slot as `field`. */
export interface TrustyFormField {
  /** The control's id, for single controls. Must reach the focusable element: `TrustyFormItem` renders `<label :for>` against it, and `TrustyForm`'s error summary links to it. Absent on `group` fields. */
  'id'?: string
  /** Labels a grouped control (radio/checkbox group) by pointing at the field's own label element. Present only on `group` fields, and only with a `label`. */
  'aria-labelledby'?: string
  /** Points at whichever of the field's hint / error text is present. */
  'aria-describedby'?: string
  /** True while the field carries an `error`. A control must DECLARE this. */
  'invalid': boolean
  /** Mirrors the field's `required`. A control must DECLARE this. */
  'required': boolean
}
