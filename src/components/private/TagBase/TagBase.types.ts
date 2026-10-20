/** Hue of a tag chip. Decorative — the app decides what a hue means. Backed by the extended palette in `styles/tokens/primitives.css`. */
export type TagBaseColor = 'blue' | 'stone' | 'purple' | 'forest' | 'mint' | 'magenta' | 'brown'

/** Props shared by TagBase and both public wrappers built on it (TrustyTag, TrustyFilterTag). Single source of truth so the wrappers forward an identical chip API without re-declaring it. */
export interface TagBaseProps {
  /** Tag text. Plain string only: keeps every tag on the design system. */
  label: string
  /** Which of the seven hues to paint. Decorative — the app decides what a hue means. */
  color?: TagBaseColor
  disabled?: boolean
}
