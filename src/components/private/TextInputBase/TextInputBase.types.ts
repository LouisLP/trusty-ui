/** Props shared by TextInputBase and every public wrapper built on it (TrustyTextInput, TrustySearchInput, TrustySecretInput). Single source of truth so the wrappers forward an identical layer-1 contract without re-declaring it. */
export interface TextInputBaseProps {
  /** Native input type. `search` is used by TrustySearchInput and `password` by TrustySecretInput (which flips it to `text` while revealed); plain fields stay text/email/url/tel. Public wrappers declare their own narrower union, so widening this one does not widen theirs. */
  type?: 'text' | 'email' | 'url' | 'tel' | 'search' | 'password'
  placeholder?: string
  disabled?: boolean
  /** Marks the field required (native + styling). Usually set via TrustyFormItem. */
  required?: boolean
  /** Paints the error state. Usually set via TrustyFormItem's slot props. */
  invalid?: boolean
}
