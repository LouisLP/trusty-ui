import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyColorInput from './TrustyColorInput.vue'

async function type(wrapper: ReturnType<typeof mount>, text: string) {
  const input = wrapper.get('input')
  input.element.value = text
  await input.trigger('input')
  await input.trigger('blur')
}

describe('trustyColorInput', () => {
  it('shows the hex digits without the hash', () => {
    const wrapper = mount(TrustyColorInput, { props: { modelValue: '#752BD4' } })
    expect(wrapper.get('input').element.value).toBe('752BD4')
  })

  it('commits on blur, normalized to uppercase', async () => {
    const wrapper = mount(TrustyColorInput)
    await type(wrapper, '752bd4')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['#752BD4'])
  })

  it('commits on Enter', async () => {
    const wrapper = mount(TrustyColorInput)
    const input = wrapper.get('input')
    input.element.value = '00ff00'
    await input.trigger('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['#00FF00'])
  })

  it('does not commit while typing', async () => {
    const wrapper = mount(TrustyColorInput)
    const input = wrapper.get('input')
    input.element.value = '752bd4'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('expands shorthand hex and drops a full-opacity alpha byte', async () => {
    const wrapper = mount(TrustyColorInput)
    await type(wrapper, 'f0a')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['#FF00AA'])
    await type(wrapper, '#752BD4ff')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['#752BD4'])
  })

  it('keeps a partial alpha byte', async () => {
    const wrapper = mount(TrustyColorInput)
    await type(wrapper, '752BD480')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['#752BD480'])
  })

  it('commits invalid text as typed, for the consumer to validate', async () => {
    const wrapper = mount(TrustyColorInput)
    await type(wrapper, 'MBSFGS')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['#MBSFGS'])
    expect(wrapper.get('input').element.value).toBe('MBSFGS')
  })

  it('commits an empty field as an empty string', async () => {
    const wrapper = mount(TrustyColorInput, { props: { modelValue: '#752BD4' } })
    await type(wrapper, '')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('shows the alpha slider only for a valid colour', async () => {
    const wrapper = mount(TrustyColorInput, { props: { modelValue: '' } })
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    await wrapper.setProps({ modelValue: '#MBSFGS' })
    expect(wrapper.find('[role="slider"]').exists()).toBe(false)
    await wrapper.setProps({ modelValue: '#752BD4' })
    expect(wrapper.find('[role="slider"]').exists()).toBe(true)
  })

  it('marks the swatch empty when there is no colour', () => {
    const wrapper = mount(TrustyColorInput)
    expect(wrapper.get('.color-picker-swatch').attributes('data-no-color')).toBeDefined()
  })

  it('marks itself invalid via aria-invalid', () => {
    const wrapper = mount(TrustyColorInput, { props: { invalid: true } })
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
  })

  it('passes through id and aria-describedby attrs onto the input', () => {
    const wrapper = mount(TrustyColorInput, {
      attrs: { 'id': 'x', 'aria-describedby': 'x-hint' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('x')
    expect(input.attributes('aria-describedby')).toBe('x-hint')
  })

  it('disables the input and the swatch trigger', () => {
    const wrapper = mount(TrustyColorInput, { props: { disabled: true } })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="Pick colour"]').attributes('disabled')).toBeDefined()
  })

  it('commits a colour picked from the area, keeping the alpha byte', async () => {
    const wrapper = mount(TrustyColorInput, { props: { modelValue: '#752BD480' }, attachTo: document.body })
    await wrapper.get('button[aria-label="Pick colour"]').trigger('click')
    const area = document.body.querySelector<HTMLElement>('[role="application"]')!
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await wrapper.vm.$nextTick()
    const value = wrapper.emitted<[string]>('update:modelValue')?.at(-1)?.[0]
    expect(value).toMatch(/^#[\dA-F]{6}80$/)
    expect(value).not.toBe('#752BD480')
    wrapper.unmount()
  })
})
