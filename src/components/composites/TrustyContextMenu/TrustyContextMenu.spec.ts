import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import TrustyContextMenu from './TrustyContextMenu.vue'

// Reka renders the menu content through a portal into document.body, so we assert against the document rather than the wrapper.

const ITEMS = [
  { value: 'rename', label: 'Rename' },
  { type: 'label' as const, label: 'Danger zone' },
  { type: 'separator' as const },
  { value: 'delete', label: 'Delete', variant: 'danger' as const },
]

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(TrustyContextMenu, {
    props: { items: ITEMS, ...props },
    slots: { default: '<div data-testid="area">Right-click me</div>' },
    attachTo: document.body,
  })
}

// Reka opens the context menu on the trigger area's contextmenu event.
async function open(wrapper: ReturnType<typeof mountMenu>) {
  await wrapper.get('[data-testid="area"]').trigger('contextmenu', { clientX: 10, clientY: 10 })
  await nextTick()
}

describe('trustyContextMenu', () => {
  it('renders the default slot as the trigger area', () => {
    const wrapper = mountMenu()

    const area = wrapper.get('[data-testid="area"]')
    expect(area.text()).toBe('Right-click me')
    // as-child merges the wiring onto our element — no extra wrapper.
    expect(area.attributes('data-state')).toBe('closed')
  })

  it('opens on right-click and renders every action row', async () => {
    const wrapper = mountMenu()

    await open(wrapper)

    const items = document.querySelectorAll('.trusty-context-menu-item')
    expect(items).toHaveLength(2)
    expect([...items].map(i => i.textContent?.trim())).toEqual(['Rename', 'Delete'])
  })

  it('renders section labels and separators', async () => {
    const wrapper = mountMenu()

    await open(wrapper)

    expect(document.querySelector('.trusty-context-menu-section')?.textContent?.trim()).toBe('Danger zone')
    expect(document.querySelector('.trusty-context-menu-separator')).not.toBeNull()
  })

  it('marks the danger variant on the destructive row', async () => {
    const wrapper = mountMenu()

    await open(wrapper)

    const danger = document.querySelector('.trusty-context-menu-item[data-variant="danger"]')
    expect(danger?.textContent?.trim()).toBe('Delete')
  })

  it('renders a keyboard badge on rows with a shortcut', async () => {
    const wrapper = mountMenu({
      items: [
        { value: 'rename', label: 'Rename', shortcut: ['ctrl', 'R'] },
        { value: 'open', label: 'Open' },
      ],
    })

    await open(wrapper)

    const badges = document.querySelectorAll('.trusty-context-menu-item-trailing')
    expect(badges).toHaveLength(1)
    const keys = badges[0]!.querySelectorAll('.trusty-keyboard-badge-key')
    expect([...keys].map(k => k.textContent)).toEqual(['⌃', 'R'])
  })

  it('emits select with the row value when chosen', async () => {
    const wrapper = mountMenu()
    await open(wrapper)

    const rename = document.querySelector('.trusty-context-menu-item') as HTMLElement
    rename.click()
    await nextTick()

    expect(wrapper.emitted('select')?.at(-1)).toEqual(['rename'])
  })

  it('disables an item flagged disabled', async () => {
    const wrapper = mountMenu({
      items: [{ value: 'open', label: 'Open', disabled: true }],
    })

    await open(wrapper)

    const item = document.querySelector('.trusty-context-menu-item')
    expect(item?.getAttribute('data-disabled')).not.toBeNull()
  })

  it('stays closed when the whole menu is disabled', async () => {
    const wrapper = mountMenu({ disabled: true })

    await open(wrapper)

    expect(document.querySelector('.trusty-context-menu-item')).toBeNull()
  })

  // Reka's hover-to-open runs on a grace timer jsdom's pointer events do not drive, so these open by click and ArrowRight; the hover is the story's `play` test.
  describe('submenu rows', () => {
    const NESTED = [
      { value: 'open', label: 'Open' },
      {
        type: 'submenu' as const,
        label: 'Move to',
        children: [
          { value: 'move:inbox', label: 'Inbox' },
          { value: 'move:archive', label: 'Archive' },
        ],
      },
    ]

    function subTrigger() {
      return document.querySelector('.trusty-context-menu-item[aria-haspopup="menu"]') as HTMLElement
    }

    it('renders a submenu row as a trigger, closed, with a marker', async () => {
      const wrapper = mountMenu({ items: NESTED })

      await open(wrapper)

      const trigger = subTrigger()
      expect(trigger.textContent?.trim()).toBe('Move to')
      expect(trigger.getAttribute('data-state')).toBe('closed')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      const marker = trigger.querySelector('.trusty-context-menu-item-marker')
      expect(marker).not.toBeNull()
      expect(marker!.getAttribute('aria-hidden')).toBe('true')
      expect(marker!.innerHTML).toContain('<svg')
      expect(document.querySelector('.trusty-context-menu-item:not([aria-haspopup]) .trusty-context-menu-item-marker')).toBeNull()
      expect(document.body.textContent).not.toContain('Archive')
    })

    it('opens the submenu and renders its children in their own surface', async () => {
      const wrapper = mountMenu({ items: NESTED })
      await open(wrapper)

      subTrigger().click()
      await nextTick()

      expect(subTrigger().getAttribute('data-state')).toBe('open')
      expect(document.querySelectorAll('.trusty-context-menu')).toHaveLength(2)
      const labels = [...document.querySelectorAll('.trusty-context-menu-item')].map(i => i.textContent?.trim())
      expect(labels).toEqual(['Open', 'Move to', 'Inbox', 'Archive'])
    })

    it('opens the submenu on ArrowRight', async () => {
      const wrapper = mountMenu({ items: NESTED })
      await open(wrapper)

      subTrigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      await nextTick()

      expect(subTrigger().getAttribute('data-state')).toBe('open')
    })

    it('emits select with the child value when a submenu row is chosen', async () => {
      const wrapper = mountMenu({ items: NESTED })
      await open(wrapper)
      subTrigger().click()
      await nextTick()

      const archive = [...document.querySelectorAll('.trusty-context-menu-item')]
        .find(i => i.textContent?.trim() === 'Archive') as HTMLElement
      archive.click()
      await nextTick()

      expect(wrapper.emitted('select')?.at(-1)).toEqual(['move:archive'])
    })

    it('never emits select for the submenu trigger itself', async () => {
      const wrapper = mountMenu({ items: NESTED })
      await open(wrapper)

      subTrigger().click()
      await nextTick()

      expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('keeps a disabled submenu closed', async () => {
      const wrapper = mountMenu({
        items: [{ type: 'submenu' as const, label: 'Move to', disabled: true, children: [{ value: 'move:inbox', label: 'Inbox' }] }],
      })
      await open(wrapper)

      const trigger = subTrigger()
      expect(trigger.getAttribute('data-disabled')).not.toBeNull()

      trigger.click()
      await nextTick()

      expect(trigger.getAttribute('data-state')).toBe('closed')
      expect(document.body.textContent).not.toContain('Inbox')
    })

    it('nests a submenu inside a submenu', async () => {
      const wrapper = mountMenu({
        items: [{
          type: 'submenu' as const,
          label: 'Move to',
          children: [{
            type: 'submenu' as const,
            label: 'Team',
            children: [{ value: 'move:team:design', label: 'Design' }],
          }],
        }],
      })
      await open(wrapper)

      const triggers = () => [...document.querySelectorAll('.trusty-context-menu-item[aria-haspopup="menu"]')] as HTMLElement[]
      triggers()[0]!.click()
      await nextTick()
      triggers()[1]!.click()
      await nextTick()

      expect(document.querySelectorAll('.trusty-context-menu')).toHaveLength(3)
      const design = [...document.querySelectorAll('.trusty-context-menu-item')]
        .find(i => i.textContent?.trim() === 'Design') as HTMLElement
      design.click()
      await nextTick()

      expect(wrapper.emitted('select')?.at(-1)).toEqual(['move:team:design'])
    })
  })
})
