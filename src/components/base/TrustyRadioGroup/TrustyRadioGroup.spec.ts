import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyRadioGroup from './TrustyRadioGroup.vue'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C', disabled: true },
]

describe('trustyRadioGroup', () => {
  it('renders one radio per option, each with a label', () => {
    const wrapper = mount(TrustyRadioGroup, { props: { options } })
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(3)
    expect(wrapper.text()).toContain('Option A')
    expect(wrapper.text()).toContain('Option B')
  })

  it('reflects the initial v-model value', () => {
    const wrapper = mount(TrustyRadioGroup, { props: { options, modelValue: 'b' } })
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios[1]!.attributes('aria-checked')).toBe('true')
  })

  it('emits update:modelValue when an option is chosen', async () => {
    const wrapper = mount(TrustyRadioGroup, { props: { options } })
    await wrapper.findAll('[role="radio"]')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
  })

  it('ties each label to its radio via for/id', () => {
    const wrapper = mount(TrustyRadioGroup, { props: { options } })
    const firstRadio = wrapper.findAll('[role="radio"]')[0]!
    const firstLabel = wrapper.findAll('label')[0]!
    expect(firstLabel.attributes('for')).toBe(firstRadio.attributes('id'))
  })

  it('disables an individual option', () => {
    const wrapper = mount(TrustyRadioGroup, { props: { options } })
    expect(wrapper.findAll('[role="radio"]')[2]!.attributes('data-disabled')).toBeDefined()
  })
})
