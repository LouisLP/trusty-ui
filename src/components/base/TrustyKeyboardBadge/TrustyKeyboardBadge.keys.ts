/** Named special keys and the glyph each renders as — the design system's `type=icon` badge variants. */
export const TRUSTY_KEYBOARD_KEY_GLYPHS = {
  cmd: '⌘',
  shift: '⇧',
  ctrl: '⌃',
  option: '⌥',
  alt: '⎇',
  capslock: '⇪',
  delete: '⌦',
  backspace: '⌫',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  home: '↖',
  end: '↘',
} as const

export type TrustyKeyboardKeyName = keyof typeof TRUSTY_KEYBOARD_KEY_GLYPHS

/* True on Apple platforms, where the primary modifier is ⌘ rather than Ctrl. Not exported: `keyGlyph` below is the only caller, and it takes the result as an overridable parameter so tests can pin the platform. */
function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  const platform
    = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
      ?? navigator.platform
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/* Keys that render as literal text — the design system's `type=text` badge variant. A closed set on purpose: extend it here when a real key is missing, rather than widening the prop to `string`. */
type TrustyKeyboardLetterKey
  = | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
    | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
type TrustyKeyboardDigitKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type TrustyKeyboardFunctionKey = `F${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`
type TrustyKeyboardNamedTextKey = 'Esc' | 'Enter' | 'Tab' | 'Space' | 'Ins' | 'PgUp' | 'PgDn'
type TrustyKeyboardPunctuationKey = '+' | '-' | '=' | ',' | '.' | '/' | '\\' | '[' | ']' | ';' | '\''

/** One key of a shortcut: `mod` (the platform's primary modifier — ⌘ on Apple platforms, Ctrl elsewhere), a named special key (renders its glyph), or a text key (letters, digits, F1–F12, Esc/Enter/…, punctuation) rendered literally. Prefer `mod` over `cmd`/`ctrl` for cross-platform shortcuts; the explicit names always render their own symbol. */
export type TrustyKeyboardKey
  = | 'mod'
    | TrustyKeyboardKeyName
    | TrustyKeyboardLetterKey
    | TrustyKeyboardDigitKey
    | TrustyKeyboardFunctionKey
    | TrustyKeyboardNamedTextKey
    | TrustyKeyboardPunctuationKey

/** What a key displays as: `mod` resolves per platform, named special keys to their glyph, text keys to themselves. */
export function keyGlyph(key: TrustyKeyboardKey, apple: boolean = isApplePlatform()): string {
  if (key === 'mod') {
    return apple ? TRUSTY_KEYBOARD_KEY_GLYPHS.cmd : 'Ctrl'
  }
  return key in TRUSTY_KEYBOARD_KEY_GLYPHS
    ? TRUSTY_KEYBOARD_KEY_GLYPHS[key as TrustyKeyboardKeyName]
    : key
}
