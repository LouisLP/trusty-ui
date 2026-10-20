import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h } from 'vue'

const bodyText = {
  style: `color: var(--color-text-muted); line-height: var(--line-height-normal);`,
}

function heading(level: 'h2' | 'h3', text: string) {
  return h(level, {
    style: `font-family: var(--font-family-display); color: var(--color-text); margin: 0 0 var(--space-sm);`,
  }, text)
}

// One row per situation that regularly trips people up. The long version of each rule lives on the component's own docs page.
const CHEAT_SHEET: [need: string, component: string][] = [
  ['Block for a yes/no decision with consequences (delete, discard, overwrite)', 'TrustyAlertDialog'],
  ['A modal the user works inside (forms, settings, pickers)', 'TrustyDialog'],
  ['View one image at full size', 'TrustyLightbox (TrustyThumbnail is a ready-made framed preview that opens one)'],
  ['An inline message the user must act on', 'TrustyAlert'],
  ['An inline message with nothing to act on', 'TrustyBanner'],
  ['A transient "that worked" notice', 'TrustyToast (or one TrustyToaster plus useTrustyToast, to raise them from TS)'],
  ['Pick a value from a short, scannable list', 'TrustySelect'],
  ['Pick a value from a long or dynamic list, filtered by typing', 'TrustyCombobox'],
  ['A few options where seeing them all helps (about five or fewer)', 'TrustyRadioGroup'],
  ['Run commands from a button', 'TrustyDropdownMenu'],
  ['Run commands on the thing under the pointer (right-click)', 'TrustyContextMenu'],
  ['Hint at a keyboard shortcut', 'TrustyKeyboardBadge'],
  ['Free text, secrets, or numbers in a form', 'TrustyTextInput / TrustySecretInput / TrustyNumberField'],
  ['Set a rough value in a bounded range', 'TrustySlider'],
  ['Rename or retune something in place', 'TrustyEditableText / TrustyEditableNumber'],
  ['An on/off control', 'TrustyCheckbox, TrustySwitch, or TrustyToggle (whichever fits the screen)'],
]

function cell(tag: 'th' | 'td', content: string, extra = '') {
  return h(tag, {
    style: `${bodyText.style} padding: var(--space-sm) var(--space-md); border-bottom: var(--border-sm) solid var(--color-border); text-align: left; ${extra}`,
  }, content)
}

const Introduction = defineComponent({
  name: 'Introduction',
  setup() {
    return () =>
      h('div', {
        style: `max-width: 40rem; margin-inline: auto; padding: var(--space-4xl) var(--space-xl); display: flex; flex-direction: column; gap: var(--space-2xl);`,
      }, [
        h('section', [
          h('h1', {
            style: 'font-family: var(--font-family-display); font-size: var(--font-size-3xl); color: var(--color-text); margin: 0 0 var(--space-md);',
          }, 'Trusty UI'),
          h('p', bodyText, [
            '@louislp/trusty-ui is the modern, accessible Vue 3 component library and the design system it carries, built on ',
            h('a', { href: 'https://reka-ui.com/', style: 'color: var(--color-primary-highlight);' }, 'Reka UI'),
            ' headless primitives. Browse the sidebar for the full component catalogue — every prop, slot, variant, and a live playground, generated from each component\'s story. Setup, the layered form system, and component-authoring rules live in the repo README.',
          ]),
        ]),

        h('section', { style: 'display: flex; flex-direction: column; gap: var(--space-md); padding-top: var(--space-xl); border-top: var(--border-sm) solid var(--color-border);' }, [
          heading('h2', 'Which component do I reach for?'),
          h('p', bodyText, 'Every component\'s docs page opens with its intended usage. This table is the short version, covering the components that regularly get mixed up.'),
          h('table', { style: 'border-collapse: collapse; width: 100%;' }, [
            h('thead', h('tr', [
              cell('th', 'You need to…', 'color: var(--color-text); border-bottom-width: var(--border-md);'),
              cell('th', 'Reach for', 'color: var(--color-text); border-bottom-width: var(--border-md);'),
            ])),
            h('tbody', CHEAT_SHEET.map(([need, component]) => h('tr', [
              cell('td', need),
              cell('td', component),
            ]))),
          ]),
        ]),
      ])
  },
})

const meta = {
  title: 'Introduction',
  component: Introduction,
  parameters: {
    // Purely a doc page — no controls or actions panel needed.
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Introduction>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}
