import type { VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import type { TrustyFormField } from './TrustyFormItem.types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { Fragment, h } from 'vue'
import * as library from '../../../index'
import TrustyFormItem from './TrustyFormItem.vue'

// The layer-1 contract, checked against every control that claims to hold it.
//
// README's "Layer 1 — Controls" states the invariant this file enforces: `id`, `aria-describedby` and `aria-labelledby` fall through to the FOCUSABLE ELEMENT, while `invalid` and `required` are DECLARED PROPS. Re-derived by hand in each control, it is easy to get wrong: landing `field.id` on an outer <label> points TrustyFormItem's own <label for> at a label, and `aria-describedby` never reaches the control.
//
// Which controls claim the contract is discovered, not listed: every public component that declares an `invalid` prop. A new one fails "every control has a case" until it gets a row in CASES — the row only carries what it needs to render.

/** Elements a `<label for>` may legally point at, and that can take focus. */
const FOCUSABLE = 'input, textarea, select, button, [tabindex], [contenteditable="true"]'

interface ControlCase {
  name: string
  component: Component
  /** Props the control needs before it will render at all. */
  props?: Record<string, unknown>
  /** Grouped controls (`group` fields) are labelled by `aria-labelledby` against the group root rather than `<label for>` against one focusable element. */
  group?: boolean
  /** Resolves once a control that mounts asynchronously has its focusable element. */
  ready?: (wrapper: VueWrapper) => Promise<unknown>
}

const ITEMS = [{ value: 'a', label: 'A' }]

const CASES: Record<string, Omit<ControlCase, 'name' | 'component'>> = {
  TrustyTextInput: {},
  TrustyTextarea: {},
  TrustySearchInput: {},
  TrustySecretInput: {},
  TrustyNumberField: {},
  TrustyColorInput: {},
  TrustySelect: { props: { items: ITEMS } },
  TrustyCombobox: { props: { items: ITEMS } },
  TrustyFileInput: {},
  TrustyTagInput: {},
  TrustyMarkdownEditor: {
    ready: wrapper => vi.waitFor(() => expect(wrapper.find('.cm-content').exists()).toBe(true), { timeout: 10_000 }),
  },
  TrustyCheckbox: {},
  TrustySwitch: {},
  TrustyRadioGroup: { props: { options: ITEMS }, group: true },
}

/** Declare `invalid` but are not layer-1 controls, with why. */
const EXEMPT: Record<string, string> = {
  TrustyEditableNumber: 'inline editor, not a form field: its guidance sends forms to TrustyNumberField inside TrustyFormItem',
  TrustyEditableText: 'inline editor, not a form field: its guidance sends forms to TrustyTextInput inside TrustyFormItem',
}

/** Every public component that declares `invalid`, and so claims the layer-1 contract. */
const claimants = Object.entries(library)
  .filter(([, c]) => typeof c === 'object' && c !== null && 'invalid' in ((c as { props?: object }).props ?? {}))
  .map(([name]) => name)
  .sort()

const CONTROLS: ControlCase[] = claimants
  .filter(name => name in CASES)
  .map(name => ({ name, component: (library as Record<string, unknown>)[name] as Component, ...CASES[name] }))

describe('layer-1 claimants', () => {
  it('finds the controls to check', () => {
    expect(claimants.length).toBeGreaterThan(0)
  })

  it('every control has a case', () => {
    expect(claimants.filter(name => !(name in CASES) && !(name in EXEMPT)), 'declares `invalid` but has no row in CASES').toEqual([])
  })

  it('every case is still a control', () => {
    expect([...Object.keys(CASES), ...Object.keys(EXEMPT)].filter(name => !claimants.includes(name)), 'row for a component that no longer declares `invalid`').toEqual([])
  })
})

async function mountField(control: ControlCase, fieldProps: Record<string, unknown>) {
  const wrapper = mount(TrustyFormItem, {
    props: { label: 'A label', hint: 'A hint', ...fieldProps, group: control.group ?? false },
    slots: {
      default: ({ field }: { field: TrustyFormField }) =>
        h(control.component, { ...field, ...control.props }),
    },
    attachTo: document.body,
  })
  await control.ready?.(wrapper)
  return wrapper
}

describe.each(CONTROLS)('layer-1 conformance: $name', (control) => {
  it('lands the field id on a focusable element, not on a wrapper', async () => {
    if (control.group) {
      // A group has no `id` in the contract; it is named via aria-labelledby.
      const wrapper = await mountField(control, {})
      const labelId = wrapper.get('.trusty-form-item-label-row span').attributes('id')
      const labelled = wrapper.get('[aria-labelledby]')
      expect(labelled.attributes('aria-labelledby')).toBe(labelId)
      return
    }

    const wrapper = await mountField(control, {})
    const controlId = wrapper.get('label').attributes('for')
    expect(controlId).toBeTruthy()

    const target = wrapper.element.querySelector(`#${CSS.escape(controlId!)}`)
    expect(target, `nothing carries the field id ${controlId}`).not.toBeNull()
    expect(
      target!.matches(FOCUSABLE),
      `field id landed on <${target!.tagName.toLowerCase()}>, which cannot take focus`,
    ).toBe(true)
  })

  // The two tests above pass in Vue's dev runtime even when the id is dropped in a consumer's build: only the dev runtime looks through a Fragment root (a root-level template comment makes one) for the element to fall through to. Production fallthrough needs one real root, or `inheritAttrs: false` with an explicit `v-bind="$attrs"`.
  it('has one root for attrs to fall through to in a production build', () => {
    const wrapper = mount(control.component, { props: control.props })
    const inheritsAttrs = (control.component as { inheritAttrs?: boolean }).inheritAttrs !== false
    if (inheritsAttrs)
      expect(wrapper.vm.$.subTree.type, 'the root is a Fragment, so a production build drops id, aria-* and data-*').not.toBe(Fragment)
  })

  it('routes aria-describedby to the same element as the id', async () => {
    const wrapper = await mountField(control, {})
    const hintId = wrapper.get('.trusty-form-item-hint').attributes('id')

    const described = wrapper.element.querySelector(`[aria-describedby~="${hintId}"]`)
    expect(described, 'aria-describedby reached nothing').not.toBeNull()

    if (!control.group) {
      const controlId = wrapper.get('label').attributes('for')
      expect(described!.id).toBe(controlId)
    }
  })

  it('declares invalid as a prop, so it becomes aria-invalid', async () => {
    const wrapper = await mountField(control, { error: 'Broken' })
    expect(wrapper.element.querySelector('[aria-invalid="true"]')).not.toBeNull()
    // A control that failed to DECLARE `invalid` leaks it into the DOM verbatim.
    expect(wrapper.element.querySelector('[invalid]')).toBeNull()
  })

  it('declares required as a prop, so it reaches the control', async () => {
    const wrapper = await mountField(control, { required: true })
    // Native `required` where the element supports it, `aria-required` where it does not (Reka's button-backed controls) — either satisfies the contract.
    expect(
      wrapper.element.querySelector('[required], [aria-required="true"]'),
      'required never reached the control',
    ).not.toBeNull()
  })
})
