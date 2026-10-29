import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { VNode } from 'vue'
import { expect, waitFor } from 'storybook/test'
import { defineComponent, h, onMounted, ref } from 'vue'
import {
  TrustyAlert,
  TrustyBadge,
  TrustyButton,
  TrustyCheckbox,
  TrustySwitch,
  TrustyTabs,
  TrustyTextInput,
} from '../../index'

// The semantic colour roles, grouped as semantic.css groups them. A swatch resolves its token live, in the page's colour scheme, so the page shows whatever primitives.css holds.
const GROUPS: [group: string, tokens: string[]][] = [
  ['Text', ['text', 'text-toned', 'text-muted', 'text-inverted']],
  ['Surfaces', ['bg-sunken', 'bg-lowered', 'bg', 'bg-elevated', 'bg-accented']],
  ['Depth', ['bg-inset', 'bg-inset-muted']],
  ['Borders', ['border-muted', 'border', 'border-highlight', 'border-danger']],
  ['Primary', ['primary', 'primary-hover', 'primary-active', 'on-primary', 'primary-highlight', 'primary-muted', 'primary-disabled', 'primary-surface', 'primary-surface-hover', 'primary-surface-active', 'on-primary-surface', 'on-primary-surface-hover']],
  ['Secondary', ['secondary', 'secondary-muted', 'on-secondary', 'secondary-highlight']],
  ['Status', ['danger-text', 'danger-surface', 'warning-text', 'warning-surface', 'success-text', 'success-surface', 'info-text', 'info-surface', 'on-status']],
  ['Controls', ['control-thumb']],
  ['Tags', ['tag-blue', 'tag-stone', 'tag-stone-text', 'tag-purple', 'tag-purple-text', 'tag-forest', 'tag-forest-text', 'tag-mint', 'tag-mint-text', 'tag-mint-strong', 'tag-magenta', 'tag-magenta-text', 'tag-magenta-ring', 'tag-brown', 'tag-brown-text']],
]

// The theme: sumi neutrals, kaki primary, seiji secondary.
const RAMPS = ['sumi', 'kaki', 'seiji']
// The dentō-shoku status dyes: kurenai danger, kariyasu warning, moegi success, hanada info.
const STATUS_RAMPS = ['kurenai', 'kariyasu', 'moegi', 'hanada']
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

type Scheme = 'light' | 'dark'
const SCHEMES: Scheme[] = ['light', 'dark']

interface Pair { fg: string, bg: string, min: 3 | 4.5 }

const TEXT_GROUNDS = ['bg-sunken', 'bg-lowered', 'bg', 'bg-elevated', 'bg-accented', 'bg-inset', 'bg-inset-muted', 'secondary', 'secondary-muted']
const PANEL_GROUNDS = ['bg-lowered', 'bg', 'bg-elevated']

// Every pair a component actually draws, with the WCAG AA floor it owes: 4.5:1 for text, 3:1 for fills, rings and boundaries.
const PAIRS: Pair[] = [
  ...['text', 'text-toned', 'text-muted'].flatMap(fg => TEXT_GROUNDS.map(bg => ({ fg, bg, min: 4.5 as const }))),
  ...['primary-highlight', 'danger-text', 'warning-text', 'success-text', 'info-text'].flatMap(fg => PANEL_GROUNDS.map(bg => ({ fg, bg, min: 4.5 as const }))),
  ...['primary', 'primary-hover', 'primary-active'].map(bg => ({ fg: 'on-primary', bg, min: 4.5 as const })),
  ...['primary-surface', 'primary-surface-active'].map(bg => ({ fg: 'on-primary-surface', bg, min: 4.5 as const })),
  { fg: 'on-primary-surface-hover', bg: 'primary-surface-hover', min: 4.5 },
  ...['secondary', 'secondary-muted'].map(bg => ({ fg: 'on-secondary', bg, min: 4.5 as const })),
  ...['danger-surface', 'warning-surface', 'success-surface', 'info-surface', 'primary-muted'].map(bg => ({ fg: 'text', bg, min: 4.5 as const })),
  ...['danger-surface', 'warning-surface', 'success-surface', 'info-surface', 'bg-accented'].map(bg => ({ fg: 'on-status', bg, min: 4.5 as const })),
  // The checked switch is on-primary on primary, gated above.
  { fg: 'control-thumb', bg: 'bg-accented', min: 3 },
  ...['primary', 'primary-highlight', 'border-highlight'].flatMap(fg => PANEL_GROUNDS.map(bg => ({ fg, bg, min: 3 as const }))),
]

type Rgb = [number, number, number]

// Resolve a custom property to sRGB by letting the browser compute it: covers var() chains, light-dark() and color-mix(). light-dark() picks its half by the probe's own color-scheme, so pass one to measure that mode, or none for the page's. The palette is oklch, which computes as oklch(); mixing in srgb makes it compute as color(srgb …) instead.
function resolve(token: string, scheme?: Scheme): Rgb {
  const probe = document.createElement('span')
  if (scheme)
    probe.style.colorScheme = scheme
  probe.style.color = `color-mix(in srgb, var(${token}) 100%, transparent)`
  document.body.append(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  const channels = computed.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
  // color(srgb r g b) reports 0–1 channels; rgb() reports 0–255.
  const scale = computed.startsWith('color(') ? 255 : 1
  return [channels[0]! * scale, channels[1]! * scale, channels[2]! * scale]
}

function luminance([r, g, b]: Rgb) {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!
}

function contrast(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const hex = (rgb: Rgb) => `#${rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`

const label = 'font-family: var(--font-family-mono); font-size: var(--font-size-xs);'

function swatch(token: string, value: string, name = token) {
  return h('figure', { style: 'margin: 0; display: grid; gap: var(--space-xs); inline-size: 9rem;' }, [
    h('div', { style: `block-size: 3rem; border-radius: var(--radius-sm); border: var(--border-sm) solid var(--color-border); background: var(${token});` }),
    h('figcaption', { style: `${label} color: var(--color-text-muted);` }, [h('div', name), h('div', value)]),
  ])
}

const Swatches = defineComponent({
  setup() {
    const values = ref<Record<string, string>>({})
    onMounted(() => {
      const all = [
        ...GROUPS.flatMap(([, tokens]) => tokens.map(t => `--color-${t}`)),
        ...RAMPS.flatMap(r => STEPS.map(s => `--color-${r}-${s}`)),
        ...STATUS_RAMPS.flatMap(r => STEPS.map(s => `--color-${r}-${s}`)),
      ]
      values.value = Object.fromEntries(all.map(t => [t, hex(resolve(t))]))
    })
    const section = (title: string, children: VNode[]) => h('section', { style: 'margin-block-end: var(--space-xl);' }, [
      h('h2', { style: 'margin: 0 0 var(--space-sm); font-size: var(--font-size-lg);' }, title),
      h('div', { style: 'display: flex; flex-wrap: wrap; gap: var(--space-md);' }, children),
    ])
    return () => h('div', { style: 'padding: var(--space-lg); background: var(--color-bg-lowered);' }, [
      ...GROUPS.map(([group, tokens]) => section(group, tokens.map(t => swatch(`--color-${t}`, values.value[`--color-${t}`] ?? '')))),
      ...RAMPS.map(r => section(`--color-${r}-* (theme ramp)`, STEPS.map(s => swatch(`--color-${r}-${s}`, values.value[`--color-${r}-${s}`] ?? '', String(s))))),
      ...STATUS_RAMPS.map(r => section(`--color-${r}-* (status ramp)`, STEPS.map(s => swatch(`--color-${r}-${s}`, values.value[`--color-${r}-${s}`] ?? '', String(s))))),
    ])
  },
})

const ContrastTable = defineComponent({
  setup() {
    const rows = ref<(Pair & { scheme: Scheme, ratio: number })[]>([])
    onMounted(() => {
      rows.value = SCHEMES.flatMap(scheme => PAIRS.map(p => ({ ...p, scheme, ratio: contrast(resolve(`--color-${p.fg}`, scheme), resolve(`--color-${p.bg}`, scheme)) })))
    })
    const cell = (content: string | VNode, extra = '') => h('td', { style: `padding: var(--space-xs) var(--space-sm); border-block-end: var(--border-sm) solid var(--color-border); ${extra}` }, [content])
    return () => h('table', { style: `${label} border-collapse: collapse; margin: var(--space-lg);` }, [
      h('thead', h('tr', ['sample', 'mode', 'foreground', 'background', 'ratio', 'AA floor', 'result'].map(c => h('th', { style: 'text-align: start; padding: var(--space-xs) var(--space-sm);' }, c)))),
      h('tbody', rows.value.map(r => h('tr', { 'data-pass': String(r.ratio >= r.min) }, [
        // A 3:1 pair is a fill or a ring, not text, so its sample is a bar: text there would trip axe's 4.5:1 text rule. The sample pins its row's scheme, so axe measures the same pair the ratio does.
        cell(r.min === 3
          ? h('span', { style: `display: inline-block; padding: var(--space-xs) var(--space-sm); color-scheme: ${r.scheme}; background: var(--color-${r.bg});` }, [h('span', { style: `display: block; inline-size: 3rem; block-size: var(--border-lg); background: var(--color-${r.fg});` })])
          : h('span', { style: `padding: var(--space-2xs) var(--space-sm); color-scheme: ${r.scheme}; color: var(--color-${r.fg}); background: var(--color-${r.bg});` }, 'Sample')),
        cell(r.scheme),
        cell(r.fg),
        cell(r.bg),
        cell(r.ratio.toFixed(2)),
        cell(`${r.min}:1`),
        cell(r.ratio >= r.min ? 'pass' : 'FAIL', `color: var(--color-${r.ratio >= r.min ? 'success' : 'danger'}-text);`),
      ]))),
    ])
  },
})

const Specimen = defineComponent({
  setup() {
    const tab = ref<string | undefined>('one')
    const row = (children: VNode[]) => h('div', { style: 'display: flex; flex-wrap: wrap; gap: var(--space-md); align-items: center;' }, children)
    const ground = (surface: string) => h('div', { style: `display: grid; gap: var(--space-lg); padding: var(--space-lg); background: var(--color-${surface});` }, [
      h('div', { style: `${label} color: var(--color-text-muted);` }, `on --color-${surface}`),
      row((['primary', 'secondary', 'outline', 'ghost', 'danger'] as const).map(variant => h(TrustyButton, { variant, label: variant }))),
      row((['primary', 'secondary'] as const).map(variant => h(TrustyButton, { variant, label: `${variant} disabled`, disabled: true }))),
      row([
        h(TrustyTextInput, { 'placeholder': 'Placeholder', 'aria-label': 'Specimen input' }),
        h(TrustyCheckbox, { label: 'Checked', modelValue: true }),
        h(TrustyCheckbox, { label: 'Unchecked', modelValue: false }),
        h(TrustySwitch, { label: 'Switch', modelValue: true }),
        h('a', { href: '#' }, 'A link'),
      ]),
      row((['neutral', 'info', 'success', 'warning', 'error'] as const).map(variant => h(TrustyBadge, { variant, label: variant }))),
      h(TrustyTabs, { 'tabs': [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }], 'modelValue': tab.value, 'onUpdate:modelValue': (v?: string) => { tab.value = v } }),
      ...(['info', 'success', 'warning', 'error'] as const).map(variant => h(TrustyAlert, { variant, title: `${variant} alert`, description: 'Body copy on the status surface.' })),
    ])
    return () => h('div', { style: 'display: grid;' }, ['bg-lowered', 'bg', 'bg-elevated'].map(ground))
  },
})

const meta = {
  title: 'Foundations/Palette',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Prototype for [#8](https://github.com/LouisLP/trusty-ui/issues/8) and [#18](https://github.com/LouisLP/trusty-ui/issues/18): every semantic colour role resolved live in the current scheme (flip it with the toolbar\'s dark-mode toggle), the theme and status ramps, the contrast of every pair a component draws in both schemes, and the components themselves on each surface. Retune a primitive and this page re-measures.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Roles: Story = { render: () => ({ components: { Swatches }, template: '<Swatches />' }) }

/** Fails if any pair drops below its AA floor in either colour scheme, which makes this story the palette gate: run `pnpm test:storybook` after retuning a colour. */
export const Contrast: Story = {
  render: () => ({ components: { ContrastTable }, template: '<ContrastTable />' }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('tbody tr').length).toBe(PAIRS.length * SCHEMES.length))
    const failures = [...canvasElement.querySelectorAll('tbody tr[data-pass="false"]')].map(tr => tr.textContent)
    await expect(failures).toEqual([])
  },
}

export const Components: Story = { render: () => ({ components: { Specimen }, template: '<Specimen />' }) }
