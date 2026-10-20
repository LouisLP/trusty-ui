import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyCard from './TrustyCard.vue'

describe('trustyCard', () => {
  it('renders the title as an h3 and the description as a paragraph', () => {
    const wrapper = mount(TrustyCard, {
      props: { title: 'Parameter', description: 'Lift, gamma and gain for this clip.' },
    })

    expect(wrapper.get('h3.trusty-card-title').text()).toBe('Parameter')
    expect(wrapper.get('p.trusty-card-description').text()).toBe('Lift, gamma and gain for this clip.')
  })

  it('renders a section', () => {
    const wrapper = mount(TrustyCard, { props: { title: 'Parameter' } })
    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('names the section after its own heading', () => {
    const wrapper = mount(TrustyCard, { props: { title: 'Parameter' } })

    const labelledBy = wrapper.get('section').attributes('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(wrapper.get('h3').attributes('id')).toBe(labelledBy)
  })

  it('leaves an untitled card unnamed, so it is not exposed as a landmark', () => {
    const wrapper = mount(TrustyCard)

    expect(wrapper.get('section').attributes('aria-labelledby')).toBeUndefined()
    expect(wrapper.find('h3').exists()).toBe(false)
  })

  it('omits the description when none is given', () => {
    const wrapper = mount(TrustyCard, { props: { title: 'Parameter' } })
    expect(wrapper.find('.trusty-card-description').exists()).toBe(false)
  })

  describe('the header row', () => {
    it('is absent without a title or an actions slot', () => {
      const wrapper = mount(TrustyCard, { props: { description: 'Just prose.' } })
      expect(wrapper.find('.trusty-card-header').exists()).toBe(false)
    })

    it('appears for a title alone, with no actions container', () => {
      const wrapper = mount(TrustyCard, { props: { title: 'Parameter' } })

      expect(wrapper.find('.trusty-card-header').exists()).toBe(true)
      expect(wrapper.find('.trusty-card-actions').exists()).toBe(false)
    })

    it('appears for actions alone', () => {
      const wrapper = mount(TrustyCard, {
        slots: { actions: '<button>Run</button>' },
      })

      expect(wrapper.find('.trusty-card-header').exists()).toBe(true)
      expect(wrapper.get('.trusty-card-actions').text()).toBe('Run')
    })
  })

  describe('the body', () => {
    it('renders the default slot', () => {
      const wrapper = mount(TrustyCard, {
        props: { title: 'Parameter' },
        slots: { default: '<p class="body">Lift</p>' },
      })
      expect(wrapper.get('.body').text()).toBe('Lift')
    })

    it('puts the slot content after the header and the description', () => {
      const wrapper = mount(TrustyCard, {
        props: { title: 'Parameter', description: 'Prose.' },
        slots: { default: '<p class="body">Lift</p>' },
      })

      const order = [...wrapper.get('section').element.children].map(child => child.className)
      expect(order).toStrictEqual(['trusty-card-header', 'trusty-card-description', 'body'])
    })
  })

  it('passes fall-through attributes to the section', () => {
    const wrapper = mount(TrustyCard, {
      props: { title: 'Parameter' },
      attrs: { 'data-testid': 'grade-card' },
    })
    expect(wrapper.get('section').attributes('data-testid')).toBe('grade-card')
  })
})
