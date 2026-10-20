import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyTextarea from './TrustyTextarea.vue'

describe('trustyTextarea', () => {
  it('renders a textarea three rows tall by default', () => {
    const wrapper = mount(TrustyTextarea)
    expect(wrapper.get('textarea').attributes('rows')).toBe('3')
  })

  it('honours the rows prop', () => {
    const wrapper = mount(TrustyTextarea, { props: { rows: 8 } })
    expect(wrapper.get('textarea').attributes('rows')).toBe('8')
  })

  it('reflects the initial v-model value', () => {
    const wrapper = mount(TrustyTextarea, { props: { modelValue: 'first\nsecond' } })
    expect(wrapper.get('textarea').element.value).toBe('first\nsecond')
  })

  it('emits update:modelValue on input, newlines included', async () => {
    const wrapper = mount(TrustyTextarea)
    const textarea = wrapper.get('textarea')
    textarea.element.value = 'one\ntwo'
    await textarea.trigger('input')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['one\ntwo'])
  })

  it('marks itself invalid via aria-invalid', () => {
    const wrapper = mount(TrustyTextarea, { props: { invalid: true } })
    expect(wrapper.get('textarea').attributes('aria-invalid')).toBe('true')
  })

  it('sets the native required attribute', () => {
    const wrapper = mount(TrustyTextarea, { props: { required: true } })
    expect(wrapper.get('textarea').attributes('required')).toBeDefined()
  })

  it('disables the textarea', () => {
    const wrapper = mount(TrustyTextarea, { props: { disabled: true } })
    expect(wrapper.get('textarea').attributes('disabled')).toBeDefined()
  })

  // The layer-1 contract: everything but invalid/required falls through to the focusable element itself.
  it('passes through id, aria-describedby and native textarea attrs', () => {
    const wrapper = mount(TrustyTextarea, {
      attrs: { 'id': 'x', 'aria-describedby': 'x-hint', 'maxlength': '40', 'name': 'notes' },
    })
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('id')).toBe('x')
    expect(textarea.attributes('aria-describedby')).toBe('x-hint')
    expect(textarea.attributes('maxlength')).toBe('40')
    expect(textarea.attributes('name')).toBe('notes')
  })

  it('flags auto-grow for the stylesheet only when asked', () => {
    expect(mount(TrustyTextarea).get('textarea').attributes('data-auto-grow')).toBeUndefined()
    expect(
      mount(TrustyTextarea, { props: { autoGrow: true } }).get('textarea').attributes('data-auto-grow'),
    ).toBeDefined()
  })
})
