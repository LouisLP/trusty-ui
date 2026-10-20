import { mount } from '@vue/test-utils'
import { ScrollAreaScrollbar } from 'reka-ui'
import { describe, expect, it } from 'vitest'

import TrustyScrollArea from './TrustyScrollArea.vue'

function mountScrollArea(props: Record<string, unknown> = {}) {
  return mount(TrustyScrollArea, {
    props,
    slots: { default: '<p>Scrollable content</p>' },
    attachTo: document.body,
  })
}

// jsdom has no geometry, so the scrollbars never actually paint; assert on the mounted scrollbar components (and their orientation) instead of the DOM.
function scrollbarOrientations(wrapper: ReturnType<typeof mountScrollArea>) {
  return wrapper.findAllComponents(ScrollAreaScrollbar).map(bar => bar.props('orientation'))
}

describe('trustyScrollArea', () => {
  it('renders the slot content inside the viewport', () => {
    const wrapper = mountScrollArea()
    expect(wrapper.get('.trusty-scroll-area-viewport').text()).toContain('Scrollable content')
  })

  it('shows only the vertical scrollbar by default', () => {
    expect(scrollbarOrientations(mountScrollArea())).toEqual(['vertical'])
  })

  it('shows only the horizontal scrollbar when axis="horizontal"', () => {
    expect(scrollbarOrientations(mountScrollArea({ axis: 'horizontal' }))).toEqual(['horizontal'])
  })

  it('shows both scrollbars when axis="both"', () => {
    expect(scrollbarOrientations(mountScrollArea({ axis: 'both' })))
      .toEqual(expect.arrayContaining(['vertical', 'horizontal']))
  })
})
