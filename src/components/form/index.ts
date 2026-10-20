// form — the layered form contract (see README "The form system — three layers"). Other components plug into this; it is not itself a composite.
export { default as TrustyForm } from './TrustyForm/TrustyForm.vue'
// The layer-2 → layer-1 contract. Consumers writing their own control against TrustyFormItem's slot need the shape; see TrustyFormItem/TrustyFormItem.types.ts.
export type { TrustyFormField } from './TrustyFormItem/TrustyFormItem.types'
export { default as TrustyFormItem } from './TrustyFormItem/TrustyFormItem.vue'
