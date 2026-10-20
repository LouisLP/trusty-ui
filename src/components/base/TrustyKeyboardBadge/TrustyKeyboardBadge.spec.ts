import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { keyGlyph } from './TrustyKeyboardBadge.keys'
import TrustyKeyboardBadge from './TrustyKeyboardBadge.vue'

describe('trustyKeyboardBadge', () => {
  it('renders one chip per key, in order', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: ['F1', 'F2', 'F3'] } })

    const chips = wrapper.findAll('.trusty-keyboard-badge-key')
    expect(chips.map(chip => chip.text())).toEqual(['F1', 'F2', 'F3'])
  })

  it('renders named special keys as their glyphs', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: ['cmd', 'shift', 'up'] } })

    const chips = wrapper.findAll('.trusty-keyboard-badge-key')
    expect(chips.map(chip => chip.text())).toEqual(['⌘', '⇧', '↑'])
  })

  it('renders unnamed keys as literal text', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: ['ctrl', 'D'] } })

    const chips = wrapper.findAll('.trusty-keyboard-badge-key')
    expect(chips.map(chip => chip.text())).toEqual(['⌃', 'D'])
  })

  it('uses semantic kbd elements for the shortcut and each key', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: ['cmd', 'K'] } })

    expect(wrapper.get('.trusty-keyboard-badge').element.tagName).toBe('KBD')
    expect(wrapper.get('.trusty-keyboard-badge-key').element.tagName).toBe('KBD')
  })

  it('resolves mod per platform: ⌘ on Apple, Ctrl elsewhere', () => {
    expect(keyGlyph('mod', true)).toBe('⌘')
    expect(keyGlyph('mod', false)).toBe('Ctrl')
  })

  it('renders mod for the detected platform (jsdom is not Apple)', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: ['mod', 'K'] } })

    const chips = wrapper.findAll('.trusty-keyboard-badge-key')
    expect(chips.map(chip => chip.text())).toEqual(['Ctrl', 'K'])
  })

  it('marks single-character chips square, multi-character chips not', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: ['cmd', 'K', 'Esc'] } })

    const chips = wrapper.findAll('.trusty-keyboard-badge-key')
    expect(chips.map(chip => chip.attributes('data-single-char'))).toEqual(['', '', undefined])
  })

  it('renders no chips for an empty key list', () => {
    const wrapper = mount(TrustyKeyboardBadge, { props: { keys: [] } })

    expect(wrapper.findAll('.trusty-keyboard-badge-key')).toHaveLength(0)
  })
})
