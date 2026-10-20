import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyThumbnail from './TrustyThumbnail.vue'

describe('trustyThumbnail', () => {
  it('renders the preview image', () => {
    const wrapper = mount(TrustyThumbnail, {
      props: { src: 'preview.png', alt: 'Sample' },
    })

    const image = wrapper.get('img')
    expect(image.attributes('src')).toBe('preview.png')
    expect(image.attributes('alt')).toBe('Sample')
  })

  it('opens the lightbox with the full-resolution source when clicked', async () => {
    const wrapper = mount(TrustyThumbnail, {
      props: { src: 'preview.png', lightboxSrc: 'full.png', alt: 'Sample' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await nextTick()

    const enlargedImage = document.querySelector('.trusty-lightbox-image img')
    expect(enlargedImage?.getAttribute('src')).toBe('full.png')
  })

  it('falls back to the preview source in the lightbox when lightboxSrc is omitted', async () => {
    const wrapper = mount(TrustyThumbnail, {
      props: { src: 'preview.png', alt: 'Sample' },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await nextTick()

    const enlargedImage = document.querySelector('.trusty-lightbox-image img')
    expect(enlargedImage?.getAttribute('src')).toBe('preview.png')
  })
})
