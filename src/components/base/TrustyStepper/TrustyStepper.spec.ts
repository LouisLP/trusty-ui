import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import TrustyStepper from './TrustyStepper.vue'

const STEPS = [
  { title: 'Details', description: 'Who you are' },
  { title: 'Address', description: 'Where you are' },
  { title: 'Payment' },
  { title: 'Review' },
]

describe('trustyStepper', () => {
  it('renders one step per item, numbered by position', () => {
    const wrapper = mount(TrustyStepper, { props: { steps: STEPS } })
    const indicators = wrapper.findAll('.trusty-stepper-indicator')

    expect(indicators).toHaveLength(4)
    expect(indicators.map(i => i.text())).toEqual(['1', '2', '3', '4'])
    expect(wrapper.text()).toContain('Details')
    expect(wrapper.text()).toContain('Who you are')
  })

  it('starts on the first step and honours the initial v-model value', () => {
    const first = mount(TrustyStepper, { props: { steps: STEPS } })
    expect(first.findAll('.trusty-stepper-trigger')[0]!.attributes('data-state')).toBe('active')

    const third = mount(TrustyStepper, { props: { steps: STEPS, modelValue: 3 } })
    expect(third.findAll('.trusty-stepper-trigger')[2]!.attributes('data-state')).toBe('active')
    expect(third.findAll('.trusty-stepper-trigger')[0]!.attributes('data-state')).toBe('completed')
  })

  it('emits the picked step when a trigger is clicked', async () => {
    const wrapper = mount(TrustyStepper, { props: { steps: STEPS, modelValue: 1 } })

    await wrapper.findAll('.trusty-stepper-trigger')[1]!.trigger('mousedown')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([2])
  })

  it('locks steps beyond the next one while linear', async () => {
    const wrapper = mount(TrustyStepper, { props: { steps: STEPS, modelValue: 1 } })

    expect(wrapper.findAll('.trusty-stepper-trigger')[1]!.attributes('data-disabled')).toBeUndefined()
    expect(wrapper.findAll('.trusty-stepper-trigger')[2]!.attributes('data-disabled')).toBeDefined()

    await wrapper.findAll('.trusty-stepper-trigger')[3]!.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('opens every step up when linear is off', async () => {
    const wrapper = mount(TrustyStepper, {
      props: { steps: STEPS, modelValue: 1, linear: false },
    })

    expect(wrapper.findAll('.trusty-stepper-trigger')[3]!.attributes('data-disabled')).toBeUndefined()

    await wrapper.findAll('.trusty-stepper-trigger')[3]!.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([4])
  })

  it('marks a disabled step and refuses to activate it', async () => {
    const steps = [
      { title: 'Details' },
      { title: 'Address', disabled: true },
      { title: 'Payment' },
    ]
    const wrapper = mount(TrustyStepper, { props: { steps, modelValue: 1, linear: false } })
    const disabled = wrapper.findAll('.trusty-stepper-trigger')[1]!

    expect(disabled.attributes('data-disabled')).toBeDefined()

    await disabled.trigger('mousedown')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('shows an icon in place of the step number', () => {
    const wrapper = mount(TrustyStepper, {
      props: { steps: [{ title: 'Details', icon: 'ph:info' }] },
    })

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:info')
    expect(wrapper.get('.trusty-stepper-indicator').text()).toBe('')
  })

  it('flags a step that needs attention', () => {
    const wrapper = mount(TrustyStepper, {
      props: { steps: [{ title: 'Details', warning: true }, { title: 'Address' }] },
    })

    expect(wrapper.findAll('.trusty-stepper-warning')).toHaveLength(1)
  })

  it('draws a connector between steps but not after the last', () => {
    const wrapper = mount(TrustyStepper, { props: { steps: STEPS } })

    expect(wrapper.findAll('.trusty-stepper-separator')).toHaveLength(3)
  })

  it('reflects the orientation on the root', () => {
    const horizontal = mount(TrustyStepper, { props: { steps: STEPS } })
    expect(horizontal.get('.trusty-stepper').attributes('data-orientation')).toBe('horizontal')

    const vertical = mount(TrustyStepper, { props: { steps: STEPS, orientation: 'vertical' } })
    expect(vertical.get('.trusty-stepper').attributes('data-orientation')).toBe('vertical')
  })

  it('names each trigger by its own step title', () => {
    const wrapper = mount(TrustyStepper, { props: { steps: STEPS } })
    const trigger = wrapper.findAll('.trusty-stepper-trigger')[0]!
    const titleId = wrapper.get('.trusty-stepper-title').attributes('id')

    expect(trigger.attributes('aria-labelledby')).toBe(titleId)
  })
  it('puts the visible step number in the trigger\'s accessible name', () => {
    const wrapper = mount(TrustyStepper, { props: { steps: STEPS } })
    const [trigger] = wrapper.findAll('.trusty-stepper-trigger')
    const title = wrapper.get(`#${trigger!.attributes('aria-labelledby')}`)

    expect(title.text()).toBe('Step 1: Details')
  })
})
