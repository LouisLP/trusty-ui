import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EditableBase from './EditableBase.vue'

describe('editableBase', () => {
  it('shows the value as a preview, with the input hidden at rest', () => {
    const wrapper = mount(EditableBase, { props: { modelValue: 'Edit 01' } })
    expect(wrapper.text()).toContain('Edit 01')
    // Reka keeps the input mounted but hidden until editing starts.
    expect(wrapper.find('input').isVisible()).toBe(false)
  })

  it('offers an edit trigger at rest', () => {
    const wrapper = mount(EditableBase, { props: { modelValue: 'x' } })
    expect(wrapper.find('button[aria-label="Edit"]').exists()).toBe(true)
  })

  it('enters edit mode, reveals the input, and hides the edit trigger', async () => {
    const wrapper = mount(EditableBase, { props: { modelValue: 'x' } })
    await wrapper.get('button[aria-label="Edit"]').trigger('click')
    expect(wrapper.find('input').isVisible()).toBe(true)
    // Confirmation is implicit (Enter / blur), so there are no save/cancel buttons.
    expect(wrapper.find('button[aria-label="Edit"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Save"]').exists()).toBe(false)
  })

  it('commits a new value on Enter', async () => {
    const wrapper = mount(EditableBase, { props: { modelValue: 'old' } })
    await wrapper.get('button[aria-label="Edit"]').trigger('click')
    const input = wrapper.get('input')
    input.element.value = 'new'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')?.at(-1)).toEqual(['new'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['new'])
  })

  it('hides the controls when disabled', () => {
    const wrapper = mount(EditableBase, { props: { modelValue: 'x', disabled: true } })
    expect(wrapper.find('button[aria-label="Edit"]').exists()).toBe(false)
  })

  it('does not enter edit mode when disabled and the preview is focused', async () => {
    const wrapper = mount(EditableBase, { props: { modelValue: 'x', disabled: true } })
    await wrapper.get('.trusty-editable-preview').trigger('focusin')
    expect(wrapper.find('input').isVisible()).toBe(false)
  })

  it('passes through fall-through attrs onto the root', () => {
    const wrapper = mount(EditableBase, { attrs: { 'aria-label': 'Project name' } })
    expect(wrapper.attributes('aria-label')).toBe('Project name')
  })
})
