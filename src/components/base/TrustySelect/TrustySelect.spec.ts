import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustySelect from './TrustySelect.vue'

// Reka renders the list through a portal into document.body, so we assert against the document rather than the wrapper.

const ITEMS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
]

function mountSelect(props: Record<string, unknown> = {}) {
  return mount(TrustySelect, {
    props: { items: ITEMS, ...props },
    attachTo: document.body,
  })
}

// Reka opens the list on Enter/Space/ArrowDown from the trigger.
async function open(wrapper: ReturnType<typeof mountSelect>) {
  await wrapper.get('.trusty-select-trigger').trigger('keydown', { key: 'Enter' })
  await nextTick()
}

describe('trustySelect', () => {
  it('shows the placeholder while nothing is selected', () => {
    const wrapper = mountSelect({ placeholder: 'Pick one…' })

    const trigger = wrapper.get('.trusty-select-trigger')
    expect(trigger.text()).toContain('Pick one…')
    expect(trigger.attributes('data-placeholder')).not.toBeUndefined()
  })

  it('marks the bound value as checked in the open list', async () => {
    // Reka's SelectValue only resolves a selected label once the items mount (first open), so we assert the checked row rather than the trigger text.
    const wrapper = mountSelect({ modelValue: 'banana' })

    await open(wrapper)

    const checked = document.querySelector('.trusty-select-item[data-state="checked"]')
    expect(checked?.textContent?.trim()).toBe('Banana')
  })

  it('forwards the accessible name to the trigger', () => {
    const wrapper = mountSelect({ ariaLabel: 'Fruit' })

    expect(wrapper.get('.trusty-select-trigger').attributes('aria-label')).toBe('Fruit')
  })

  it('opens the list and renders every option', async () => {
    const wrapper = mountSelect()

    await open(wrapper)

    const items = document.querySelectorAll('.trusty-select-item')
    expect([...items].map(i => i.textContent?.trim())).toEqual(['Apple', 'Banana', 'Cherry'])
  })

  it('marks a disabled option', async () => {
    const wrapper = mountSelect()

    await open(wrapper)

    const cherry = [...document.querySelectorAll('.trusty-select-item')]
      .find(i => i.textContent?.trim() === 'Cherry')
    expect(cherry?.getAttribute('data-disabled')).not.toBeNull()
  })

  it('renders a leading icon only on the options that ask for one', async () => {
    const wrapper = mountSelect({
      items: [
        { value: 'apple', label: 'Apple', icon: 'ph:plus' },
        { value: 'banana', label: 'Banana' },
      ],
    })

    await open(wrapper)

    const items = [...document.querySelectorAll('.trusty-select-item')]
    expect(items[0]?.querySelector('.trusty-select-item-icon')).not.toBeNull()
    expect(items[1]?.querySelector('.trusty-select-item-icon')).toBeNull()
  })

  it('echoes the selected option\'s icon on the trigger', async () => {
    const wrapper = mountSelect({
      items: [
        { value: 'apple', label: 'Apple', icon: 'ph:plus' },
        { value: 'banana', label: 'Banana' },
      ],
    })

    expect(wrapper.find('.trusty-select-trigger-leading-icon').exists()).toBe(false)

    await wrapper.setProps({ modelValue: 'apple' })
    expect(wrapper.find('.trusty-select-trigger-leading-icon').exists()).toBe(true)

    await wrapper.setProps({ modelValue: 'banana' })
    expect(wrapper.find('.trusty-select-trigger-leading-icon').exists()).toBe(false)
  })

  it('mirrors the invalid state onto the trigger', () => {
    const wrapper = mountSelect({ invalid: true })

    const trigger = wrapper.get('.trusty-select-trigger')
    expect(trigger.attributes('aria-invalid')).toBe('true')
    expect(trigger.attributes('data-invalid')).not.toBeUndefined()
  })

  it('does not open when disabled', async () => {
    const wrapper = mountSelect({ disabled: true })

    await open(wrapper)

    expect(document.querySelector('.trusty-select-item')).toBeNull()
    expect(wrapper.get('.trusty-select-trigger').attributes('data-disabled')).not.toBeUndefined()
  })

  it('renders the default variant unless ghost is asked for', async () => {
    const wrapper = mountSelect()

    expect(wrapper.get('.trusty-select-trigger').attributes('data-variant')).toBe('default')

    await wrapper.setProps({ variant: 'ghost' })
    expect(wrapper.get('.trusty-select-trigger').attributes('data-variant')).toBe('ghost')
  })

  it('still opens the list as a ghost', async () => {
    const wrapper = mountSelect({ variant: 'ghost' })

    await open(wrapper)

    expect(document.querySelectorAll('.trusty-select-item')).toHaveLength(3)
  })
})
