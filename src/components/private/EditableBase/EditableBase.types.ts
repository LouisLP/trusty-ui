/** Props shared by EditableBase and the public wrappers built on it (TrustyEditableText, TrustyEditableNumber). Single source of truth so the wrappers forward an identical common API without re-declaring it. */
export interface EditableBaseProps {
  placeholder?: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  /** Max characters allowed in edit mode. */
  maxLength?: number
}
