import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import TrustyHoverCard from './TrustyHoverCard.vue'

// The card opens on a 700ms delay, so the clock is faked and advanced by hand.
beforeEach(() => {
  vi.useFakeTimers()
})

// Reka renders the card through a portal into document.body, so we assert against the document rather than the wrapper.
afterEach(() => {
  vi.useRealTimers()
})

function mountHoverCard(props: Record<string, unknown> = {}, slots?: Record<string, string>) {
  return mount(TrustyHoverCard, {
    props: { title: 'Title', ...props },
    slots: slots ?? {
      trigger: '<button type="button">Hover me</button>',
      default: '<p>Card body</p>',
    },
    attachTo: document.body,
  })
}

/** Hover the trigger and let the open delay elapse. */
async function hover(wrapper: ReturnType<typeof mountHoverCard>) {
  await wrapper.get('button').trigger('pointerenter')
  vi.runAllTimers()
  await nextTick()
}

describe('trustyHoverCard', () => {
  it('renders the trigger slot and nothing else while closed', () => {
    const wrapper = mountHoverCard()

    const trigger = wrapper.get('button')
    expect(trigger.text()).toBe('Hover me')
    // as-child merges the wiring onto our button — no anchor wrapper.
    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(document.querySelector('.trusty-hover-card')).toBeNull()
  })

  it('opens on hover and renders title, description and body', async () => {
    const wrapper = mountHoverCard({ description: 'Supplementary detail' })

    await hover(wrapper)

    const card = document.querySelector('.trusty-hover-card')
    expect(card).not.toBeNull()
    expect(card?.textContent).toContain('Title')
    expect(card?.textContent).toContain('Supplementary detail')
    expect(card?.textContent).toContain('Card body')
  })

  it('always renders the title and omits the description when unset', async () => {
    const wrapper = mountHoverCard()

    await hover(wrapper)

    expect(document.querySelector('.trusty-hover-card-title')?.textContent?.trim()).toBe('Title')
    expect(document.querySelector('.trusty-hover-card-description')).toBeNull()
  })

  it('omits the body when no default slot is given', async () => {
    const wrapper = mountHoverCard({}, { trigger: '<button type="button">Hover me</button>' })

    await hover(wrapper)

    expect(document.querySelector('.trusty-hover-card')).not.toBeNull()
    expect(document.querySelector('.trusty-hover-card-body')).toBeNull()
  })

  it('reflects the anchored side and alignment on the card', async () => {
    const wrapper = mountHoverCard({ side: 'right', alignment: 'start' })

    await hover(wrapper)

    const card = document.querySelector('.trusty-hover-card')
    expect(card?.getAttribute('data-side')).toBe('right')
    expect(card?.getAttribute('data-align')).toBe('start')
  })

  it('stays closed until the open delay has elapsed', async () => {
    const wrapper = mountHoverCard()

    await wrapper.get('button').trigger('pointerenter')
    vi.advanceTimersByTime(100)
    await nextTick()

    expect(document.querySelector('.trusty-hover-card')).toBeNull()
  })

  it('opens immediately when open is controlled', async () => {
    mountHoverCard({ open: true })
    await nextTick()

    expect(document.querySelector('.trusty-hover-card-title')?.textContent?.trim()).toBe('Title')
  })
})
