import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyEditableNumber from './TrustyEditableNumber.vue'

async function commit(wrapper: ReturnType<typeof mount>, raw: string) {
  await wrapper.get('button[aria-label="Edit"]').trigger('click')
  const input = wrapper.get('input')
  ;(input.element as HTMLInputElement).value = raw
  await input.trigger('input')
  await input.trigger('keydown', { key: 'Enter' })
}

describe('trustyEditableNumber', () => {
  it('shows the number as a preview', () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 42.5 } })
    expect(wrapper.text()).toContain('42.5')
  })

  it('commits a parsed number on Enter', async () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 1 } })
    await commit(wrapper, '42.5')
    expect(wrapper.emitted('submit')?.at(-1)).toEqual([42.5])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([42.5])
  })

  it('clamps the committed value into [min, max]', async () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 5, min: 0, max: 10 } })
    await commit(wrapper, '99')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([10])
    await commit(wrapper, '-3')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0])
  })

  it('rounds the committed value to the given precision', async () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 0, precision: 2 } })
    await commit(wrapper, '1.2345')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1.23])
  })

  it('reverts unparseable input to the last committed value without emitting', async () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 7 } })
    await commit(wrapper, 'abc')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('7')
  })

  it('commits null when cleared', async () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 7 } })
    await commit(wrapper, '')
    expect(wrapper.emitted('submit')?.at(-1)).toEqual([null])
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
  })

  it('re-syncs the preview when the model changes from outside', async () => {
    const wrapper = mount(TrustyEditableNumber, { props: { modelValue: 1 } })
    await wrapper.setProps({ modelValue: 2 })
    expect(wrapper.text()).toContain('2')
  })
})
