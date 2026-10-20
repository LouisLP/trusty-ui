import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import TrustyCombobox from './TrustyCombobox.vue'

// jsdom has no scrollIntoView; Reka's listbox calls it on highlight.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Reka portals the list to document.body, so query the document, not the wrapper.
let active: ReturnType<typeof mount> | undefined
afterEach(() => {
  active?.unmount()
  active = undefined
})

const ITEMS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
]

function mountCombobox(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  active = mount(TrustyCombobox, {
    props: { items: ITEMS, ...props },
    attrs,
    attachTo: document.body,
  })
  return active
}

// Reka opens the list on ArrowDown from the input.
async function open(wrapper: ReturnType<typeof mountCombobox>) {
  await wrapper.get('.trusty-combobox-input').trigger('keydown', { key: 'ArrowDown' })
  await nextTick()
}

describe('trustyCombobox', () => {
  it('renders the input with placeholder and accessible name', () => {
    const wrapper = mountCombobox({ placeholder: 'Pick fruit…', ariaLabel: 'Fruit' })
    const input = wrapper.get('.trusty-combobox-input')
    expect(input.attributes('placeholder')).toBe('Pick fruit…')
    expect(input.attributes('aria-label')).toBe('Fruit')
  })

  it('opens the list and renders every option', async () => {
    const wrapper = mountCombobox()
    await open(wrapper)
    const items = document.querySelectorAll('.trusty-combobox-item')
    expect([...items].map(i => i.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry'])
  })

  it('filters options by the typed query', async () => {
    const wrapper = mountCombobox()
    const input = wrapper.get('.trusty-combobox-input')
    await input.setValue('ban')
    await nextTick()
    const visible = [...document.querySelectorAll('.trusty-combobox-item')]
      .filter(i => (i as HTMLElement).offsetParent !== null || true)
      .map(i => i.textContent?.trim())
    expect(visible).toEqual(['Banana'])
  })

  it('shows the empty state when nothing matches', async () => {
    const wrapper = mountCombobox({ emptyText: 'Nope.' })
    await wrapper.get('.trusty-combobox-input').setValue('zzz')
    await nextTick()
    expect(document.querySelector('.trusty-combobox-empty')?.textContent?.trim()).toBe('Nope.')
  })

  it('marks the bound value as checked', async () => {
    const wrapper = mountCombobox({ modelValue: 'banana' })
    await open(wrapper)
    const checked = document.querySelector('.trusty-combobox-item[data-state="checked"]')
    expect(checked?.textContent?.trim()).toBe('Banana')
  })

  it('shows the selected option label in the input', () => {
    const wrapper = mountCombobox({ modelValue: 'banana' })
    expect((wrapper.get('.trusty-combobox-input').element as HTMLInputElement).value).toBe('Banana')
  })

  it('marks a disabled option', async () => {
    const wrapper = mountCombobox()
    await open(wrapper)
    const cherry = [...document.querySelectorAll('.trusty-combobox-item')]
      .find(i => i.textContent?.trim() === 'Cherry')
    expect(cherry?.getAttribute('data-disabled')).not.toBeNull()
  })

  it('mirrors the invalid state onto input and anchor', () => {
    const wrapper = mountCombobox({ invalid: true })
    expect(wrapper.get('.trusty-combobox-input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('.trusty-combobox-anchor').attributes('data-invalid')).not.toBeUndefined()
  })

  it('disables the input when disabled', () => {
    const wrapper = mountCombobox({ disabled: true })
    expect(wrapper.get('.trusty-combobox-input').attributes('disabled')).not.toBeUndefined()
  })

  it('disables the cancel and trigger buttons when disabled', () => {
    const wrapper = mountCombobox({ disabled: true })
    expect(wrapper.get('.trusty-combobox-cancel').attributes('disabled')).not.toBeUndefined()
    expect(wrapper.get('.trusty-combobox-trigger').attributes('disabled')).not.toBeUndefined()
  })

  it('does not clear the value via cancel while disabled', async () => {
    const wrapper = mountCombobox({ modelValue: 'banana', disabled: true })
    await wrapper.get('.trusty-combobox-cancel').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('clears the selected value when the cancel button is clicked', async () => {
    const wrapper = mountCombobox({ modelValue: 'banana' })
    await wrapper.get('.trusty-combobox-cancel').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('forwards fall-through attrs (id, aria-describedby) onto the input', () => {
    const wrapper = mountCombobox({}, { 'id': 'fruit-field', 'aria-describedby': 'fruit-hint' })
    const input = wrapper.get('.trusty-combobox-input')
    expect(input.attributes('id')).toBe('fruit-field')
    expect(input.attributes('aria-describedby')).toBe('fruit-hint')
  })
})
