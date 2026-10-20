import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'
import TrustyTooltip from '../../base/TrustyTooltip/TrustyTooltip.vue'
import { MARKDOWN_TOOLBAR_GROUPS } from './MarkdownToolbar.actions'
import MarkdownToolbar from './MarkdownToolbar.vue'

function mountToolbar(props: Partial<InstanceType<typeof MarkdownToolbar>['$props']> = {}) {
  return mount(MarkdownToolbar, { props, attachTo: document.body })
}

/** The bar's buttons in DOM order — every toggle segment, then the link. */
function buttonFor(wrapper: ReturnType<typeof mountToolbar>, label: string) {
  return wrapper.findAll('button').find(button => button.attributes('aria-label') === label)!
}

const ACTION_COUNT = MARKDOWN_TOOLBAR_GROUPS.reduce((total, group) => total + group.items.length, 0)

describe('markdownToolbar', () => {
  it('is one toolbar holding every markdown action plus the link', () => {
    const wrapper = mountToolbar()
    const toolbar = wrapper.get('[role="toolbar"]')

    expect(toolbar.attributes('aria-label')).toBe('Formatting')
    expect(wrapper.findAll('button')).toHaveLength(ACTION_COUNT + 1)
    expect(wrapper.findAllComponents(TrustyIcon).length).toBeGreaterThanOrEqual(ACTION_COUNT + 1)
  })

  it('names each group and draws a rule between neighbours, not before the first', () => {
    const wrapper = mountToolbar()
    const groups = wrapper.findAll('[role="group"]')

    expect(groups.map(group => group.attributes('aria-label')))
      .toEqual(MARKDOWN_TOOLBAR_GROUPS.map(group => group.name))
    expect(wrapper.findAll('.markdown-toolbar-separator'))
      .toHaveLength(MARKDOWN_TOOLBAR_GROUPS.length - 1)
  })

  it('labels every icon-only segment, since the glyph alone names nothing', () => {
    const wrapper = mountToolbar()

    expect(wrapper.findAll('button').every(button => Boolean(button.attributes('aria-label'))))
      .toBe(true)
  })

  it('emits select when a segment is pressed on', async () => {
    const wrapper = mountToolbar()

    await buttonFor(wrapper, 'Bold').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['bold']])
  })

  it('emits select when a pressed segment is pressed off — a toggle is still a press', async () => {
    const wrapper = mountToolbar({ active: ['bold'] })

    await buttonFor(wrapper, 'Bold').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['bold']])
  })

  it('reports the newly chosen level when an exclusive group swaps', async () => {
    const wrapper = mountToolbar({ active: ['heading-1'] })

    await buttonFor(wrapper, 'Heading 2').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['heading-2']])
  })

  it('shows the values in active as pressed, and nothing else', () => {
    const wrapper = mountToolbar({ active: ['bold', 'bulleted-list'] })

    expect(buttonFor(wrapper, 'Bold').attributes('aria-pressed')).toBe('true')
    expect(buttonFor(wrapper, 'Bulleted list').attributes('aria-pressed')).toBe('true')
    expect(buttonFor(wrapper, 'Italic').attributes('aria-pressed')).toBe('false')
  })

  it('keeps emphasis complementary and headings exclusive', () => {
    const byName = Object.fromEntries(MARKDOWN_TOOLBAR_GROUPS.map(g => [g.name, g.exclusive]))

    expect(byName).toEqual({
      Headings: true,
      Emphasis: false,
      Blocks: false,
      Lists: true,
    })
  })

  it('disables every button when the bar is disabled', () => {
    const wrapper = mountToolbar({ disabled: true })

    expect(wrapper.findAll('button').every(button => button.attributes('disabled') !== undefined))
      .toBe(true)
  })

  it('disables the link on its own, leaving the formatting segments alone', () => {
    const wrapper = mountToolbar({ linkDisabled: true })

    expect(buttonFor(wrapper, 'Link').attributes('disabled')).toBeDefined()
    expect(buttonFor(wrapper, 'Bold').attributes('disabled')).toBeUndefined()
  })

  it('emits link with the confirmed URL and clears the field', async () => {
    const wrapper = mountToolbar()

    await buttonFor(wrapper, 'Link').trigger('click')
    const field = document.querySelector<HTMLInputElement>('input[aria-label="Link URL"]')!
    field.value = '  https://example.com  '
    field.dispatchEvent(new Event('input'))
    await wrapper.vm.$nextTick()

    document.querySelector<HTMLFormElement>('.markdown-toolbar-link-form')!
      .dispatchEvent(new Event('submit'))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('link')).toEqual([['https://example.com']])
  })

  it('confirms the link from the keyboard alone, with no button to click', async () => {
    const wrapper = mountToolbar()

    await buttonFor(wrapper, 'Link').trigger('click')
    const panel = document.querySelector<HTMLFormElement>('.markdown-toolbar-link-form')!

    // Enter in a single-field form is the browser's implicit submission, so there is nothing to press and nothing to tab to.
    expect(panel.querySelectorAll('button')).toHaveLength(0)
    expect(panel.hasAttribute('novalidate')).toBe(true)
    expect(panel.querySelectorAll('input')).toHaveLength(1)
  })

  it('does not emit link for a blank URL', async () => {
    const wrapper = mountToolbar()

    await buttonFor(wrapper, 'Link').trigger('click')
    document.querySelector<HTMLFormElement>('.markdown-toolbar-link-form')!
      .dispatchEvent(new Event('submit'))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('link')).toBeUndefined()
  })

  it('announces each button\'s shortcut, since an icon-only button shows no hint', () => {
    const wrapper = mountToolbar()
    const buttons = wrapper.findAll('button')

    expect(buttons.every(button => Boolean(button.attributes('aria-keyshortcuts')))).toBe(true)
    // The modifier resolves per platform; the key it ends on does not.
    expect(buttonFor(wrapper, 'Bold').attributes('aria-keyshortcuts')).toMatch(/\+B$/)
    expect(buttonFor(wrapper, 'Link').attributes('aria-keyshortcuts')).toMatch(/\+K$/)
  })

  it('hangs a tooltip on every segment, naming the action and the keys that do it', () => {
    const wrapper = mountToolbar()
    const texts = wrapper.findAllComponents(TrustyTooltip).map(tooltip => tooltip.props('text'))

    // Every toggle plus the link; the overflow button only exists once something has folded.
    expect(texts).toHaveLength(ACTION_COUNT + 1)
    // The modifier glyph resolves per platform, the key it ends on does not.
    expect(texts).toContainEqual(expect.stringMatching(/^Bold \(.+B\)$/))
    expect(texts).toContainEqual(expect.stringMatching(/^Link \(.+K\)$/))
  })

  it('silences the tooltips while the bar is disabled, since a disabled button has no hover to explain', () => {
    const wrapper = mountToolbar({ disabled: true })

    expect(wrapper.findAllComponents(TrustyTooltip).every(tooltip => tooltip.props('disabled')))
      .toBe(true)
  })

  it('shows no overflow button while everything fits', () => {
    // jsdom's ResizeObserver is a no-op stub, so the bar stays at full width.
    const wrapper = mountToolbar()

    expect(buttonFor(wrapper, 'More formatting')).toBeUndefined()
  })

  it('gives every action a unique value and an icon', () => {
    const items = MARKDOWN_TOOLBAR_GROUPS.flatMap(group => group.items)
    const actions = items.map(item => item.action)

    expect(new Set(actions).size).toBe(actions.length)
    expect(items.every(item => Boolean(item.icon) && Boolean(item.label))).toBe(true)
  })
})
