import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyEditableText from './TrustyEditableText.vue'

describe('trustyEditableText', () => {
  it('shows the value as a preview, with the input hidden at rest', () => {
    const wrapper = mount(TrustyEditableText, { props: { modelValue: 'Edit 01' } })
    expect(wrapper.text()).toContain('Edit 01')
    expect(wrapper.find('input').isVisible()).toBe(false)
  })

  it('commits a new value on Enter', async () => {
    const wrapper = mount(TrustyEditableText, { props: { modelValue: 'old' } })
    await wrapper.get('button[aria-label="Edit"]').trigger('click')
    const input = wrapper.get('input')
    input.element.value = 'new'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')?.at(-1)).toEqual(['new'])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['new'])
  })

  it('forwards maxLength to the input', async () => {
    const wrapper = mount(TrustyEditableText, { props: { modelValue: 'x', maxLength: 10 } })
    await wrapper.get('button[aria-label="Edit"]').trigger('click')
    expect(wrapper.get('input').attributes('maxlength')).toBe('10')
  })

  it('passes through fall-through attrs onto the root', () => {
    const wrapper = mount(TrustyEditableText, { attrs: { 'aria-label': 'Project name' } })
    expect(wrapper.attributes('aria-label')).toBe('Project name')
  })
})
