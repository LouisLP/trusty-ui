import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyTagInput from './TrustyTagInput.vue'

describe('trustyTagInput', () => {
  it('renders one chip per committed tag', () => {
    const wrapper = mount(TrustyTagInput, { props: { modelValue: ['tag', 'label'] } })
    const chips = wrapper.findAll('.trusty-tag-input-tag')
    expect(chips).toHaveLength(2)
    expect(chips.map(chip => chip.text())).toEqual(['tag', 'label'])
  })

  it('renders no chip row while empty', () => {
    const wrapper = mount(TrustyTagInput)
    expect(wrapper.find('.trusty-tag-input-tags').exists()).toBe(false)
  })

  it('commits the typed value on Enter', async () => {
    const wrapper = mount(TrustyTagInput)
    const input = wrapper.get('input')
    input.element.value = 'apple'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['apple']])
  })

  it('rejects a duplicate', async () => {
    const wrapper = mount(TrustyTagInput, { props: { modelValue: ['apple'] } })
    const input = wrapper.get('input')
    input.element.value = 'apple'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('stops accepting tags at max', async () => {
    const wrapper = mount(TrustyTagInput, { props: { modelValue: ['apple'], max: 1 } })
    const input = wrapper.get('input')
    input.element.value = 'pear'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('removes a tag through its delete button', async () => {
    const wrapper = mount(TrustyTagInput, { props: { modelValue: ['tag', 'label'] } })
    await wrapper.get('.trusty-tag-input-tag-delete').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['label']])
  })

  // Reka names the button after the chip's text and wins over any aria-label of ours. Pinned because the story queries by it.
  it('names each delete button after its tag', () => {
    const wrapper = mount(TrustyTagInput, { props: { modelValue: ['keyword'] } })
    const labelId = wrapper.get('.trusty-tag-input-tag-label').attributes('id')
    expect(labelId).toBeTruthy()
    expect(wrapper.get('.trusty-tag-input-tag-delete').attributes('aria-labelledby'))
      .toBe(labelId)
    expect(wrapper.get('.trusty-tag-input-tag-delete').attributes('aria-label')).toBeUndefined()
  })

  // Two attributes on purpose: Reka owns `data-invalid` for a refused entry.
  it('marks itself invalid via aria-invalid on the input and data-field-invalid on the shell', () => {
    const wrapper = mount(TrustyTagInput, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('.trusty-tag-input').attributes('data-field-invalid')).toBeDefined()
  })

  it('leaves the shell unmarked while valid', () => {
    const wrapper = mount(TrustyTagInput)
    expect(wrapper.get('.trusty-tag-input').attributes('data-field-invalid')).toBeUndefined()
  })

  it('passes through id and aria-describedby attrs onto the input', () => {
    const wrapper = mount(TrustyTagInput, {
      attrs: { 'id': 'tags', 'aria-describedby': 'tags-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('tags')
    expect(input.attributes('aria-describedby')).toBe('tags-hint')
  })

  it('disables the whole control', () => {
    const wrapper = mount(TrustyTagInput, { props: { modelValue: ['tag'], disabled: true } })
    expect(wrapper.get('.trusty-tag-input').attributes('data-disabled')).toBeDefined()
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })
})
