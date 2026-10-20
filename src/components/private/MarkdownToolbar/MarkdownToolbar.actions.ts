import type { TrustyIconName } from '../../../icons'
import type { TrustyKeyboardKey } from '../../base/TrustyKeyboardBadge/TrustyKeyboardBadge.keys'

/** Every formatting action the markdown toolbar can report. The toolbar edits no text; it only says which action was pressed. */
export type MarkdownToolbarAction
  = | 'heading-1'
    | 'heading-2'
    | 'heading-3'
    | 'bold'
    | 'underline'
    | 'italic'
    | 'strikethrough'
    | 'link'
    | 'quote'
    | 'inline-code'
    | 'code-block'
    | 'bulleted-list'
    | 'numbered-list'

/** One segment in a group. `label` is both its accessible name and its tooltip. */
export interface MarkdownToolbarItem {
  action: MarkdownToolbarAction
  label: string
  icon: TrustyIconName
  /** Keys in press order, `mod` standing for the platform's primary modifier. Display-only: the toolbar renders no text area, so `markdownShortcutFor` is how the editor turns a real event back into an action. */
  shortcut: TrustyKeyboardKey[]
}

/** A run of segments whose borders collapse into one strip, separated from its neighbours by a rule. A line carries one heading level and one list kind, so those groups are `exclusive`; emphasis stacks and a quote can hold inline code, so those do not. */
export interface MarkdownToolbarGroup {
  /** Names the group to assistive tech, since a bare run of icons does not. */
  name: string
  exclusive: boolean
  items: MarkdownToolbarItem[]
}

/** Every glyph is Phosphor regular, so `generate:icons` bundles each one and the toolbar renders offline. */
export const MARKDOWN_TOOLBAR_GROUPS: MarkdownToolbarGroup[] = [
  {
    name: 'Headings',
    exclusive: true,
    items: [
      { action: 'heading-1', label: 'Heading 1', icon: 'ph:text-h-one', shortcut: ['mod', 'shift', '1'] },
      { action: 'heading-2', label: 'Heading 2', icon: 'ph:text-h-two', shortcut: ['mod', 'shift', '2'] },
      { action: 'heading-3', label: 'Heading 3', icon: 'ph:text-h-three', shortcut: ['mod', 'shift', '3'] },
    ],
  },
  {
    name: 'Emphasis',
    exclusive: false,
    items: [
      { action: 'bold', label: 'Bold', icon: 'ph:text-b', shortcut: ['mod', 'B'] },
      { action: 'underline', label: 'Underline', icon: 'ph:text-underline', shortcut: ['mod', 'U'] },
      { action: 'italic', label: 'Italic', icon: 'ph:text-italic', shortcut: ['mod', 'I'] },
      { action: 'strikethrough', label: 'Strikethrough', icon: 'ph:text-strikethrough', shortcut: ['mod', 'shift', 'X'] },
    ],
  },
  {
    name: 'Blocks',
    exclusive: false,
    items: [
      { action: 'quote', label: 'Quote', icon: 'ph:quotes', shortcut: ['mod', 'shift', '.'] },
      { action: 'inline-code', label: 'Inline code', icon: 'ph:code', shortcut: ['mod', 'E'] },
      { action: 'code-block', label: 'Code block', icon: 'ph:code-block', shortcut: ['mod', 'shift', 'E'] },
    ],
  },
  {
    name: 'Lists',
    exclusive: true,
    items: [
      { action: 'bulleted-list', label: 'Bulleted list', icon: 'ph:list-bullets', shortcut: ['mod', 'shift', '8'] },
      { action: 'numbered-list', label: 'Numbered list', icon: 'ph:list-numbers', shortcut: ['mod', 'shift', '7'] },
    ],
  },
]

/** The link item, which is a popover trigger rather than a toggle. */
export const MARKDOWN_TOOLBAR_LINK: MarkdownToolbarItem = {
  action: 'link',
  label: 'Link',
  icon: 'ph:link',
  shortcut: ['mod', 'K'],
}

/** Every item on the bar, groups first, then the link. */
export const MARKDOWN_TOOLBAR_ITEMS: MarkdownToolbarItem[] = [
  ...MARKDOWN_TOOLBAR_GROUPS.flatMap(group => group.items),
  MARKDOWN_TOOLBAR_LINK,
]

/** The same shortcut in `aria-keyshortcuts` syntax — "Control+Shift+X". `mod` is written out as Control on every platform because the attribute is only a hint, both keys actually work, and TrustyKeyboardBadge already draws ⌘ where a Mac user expects it. */
export function ariaKeyShortcuts(keys: TrustyKeyboardKey[]): string {
  return keys
    .map((key) => {
      if (key === 'mod')
        return 'Control'
      if (key === 'shift')
        return 'Shift'
      return key
    })
    .join('+')
}

function keyMatches(key: TrustyKeyboardKey, event: KeyboardEvent): boolean {
  // Letters go through `key`, which respects the user's layout, so a Dvorak typist gets the letter printed on the cap they pressed.
  if (/^[A-Z]$/.test(key))
    return event.key.toUpperCase() === key

  // Digits and punctuation go through `code`: holding Shift rewrites `key` ("8" becomes "*"), and every one of these shortcuts holds Shift.
  if (/^\d$/.test(key))
    return event.code === `Digit${key}`
  if (key === '.')
    return event.code === 'Period'

  return false
}

/** The action a keydown asks for, or `undefined`. The editor owns the listener; this keeps the key matching next to the table the bar announces, so the two cannot disagree. */
export function markdownShortcutFor(event: KeyboardEvent): MarkdownToolbarAction | undefined {
  // `mod` is either primary modifier, no platform sniffing: ⌘B and Ctrl+B both mean Bold.
  if (!(event.metaKey || event.ctrlKey) || event.altKey)
    return undefined

  return MARKDOWN_TOOLBAR_ITEMS.find((item) => {
    const final = item.shortcut.at(-1)
    return final !== undefined
      && event.shiftKey === item.shortcut.includes('shift')
      && keyMatches(final, event)
  })?.action
}
