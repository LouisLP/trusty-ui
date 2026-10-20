import type { TrustyTreeItem } from './TrustyTree.types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'
import { moveTreeItem } from './TrustyTree.move'
import TrustyTree from './TrustyTree.vue'

const ITEMS: TrustyTreeItem[] = [
  {
    id: 'rig',
    label: 'Rig',
    children: [
      {
        id: 'camera',
        label: 'Camera',
        children: [
          { id: 'focal', label: 'focal_length', icon: 'ph:brackets-curly' },
          { id: 'aperture', label: 'aperture', icon: 'ph:brackets-curly' },
        ],
      },
      { id: 'light', label: 'Light' },
    ],
  },
  { id: 'fps', label: 'frame_rate', icon: 'ph:brackets-curly' },
]

function rows(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('[role="treeitem"]')
}

function rowById(wrapper: ReturnType<typeof mount>, id: string) {
  return wrapper.get(`[data-id="${id}"]`)
}

/** jsdom lays nothing out, so a row's box is all zeros and every drop would read as `before`. Give the row a 20px-tall box at the top of the viewport, so a `clientY` in the test is a fraction of the row's height. */
function withHeight<T extends { element: Element }>(row: T) {
  row.element.getBoundingClientRect = () => ({ top: 0, height: 20 }) as DOMRect
  return row
}

/** A drag from `id` dropped on `targetId` at `clientY` within its 20px row. */
async function drag(wrapper: ReturnType<typeof mount>, id: string, targetId: string, clientY: number) {
  await rowById(wrapper, id).trigger('dragstart')
  const target = withHeight(rowById(wrapper, targetId))
  await target.trigger('dragover', { clientY })
  await target.trigger('drop', { clientY })
}

describe('trustyTree', () => {
  it('renders only root rows while collapsed', () => {
    const wrapper = mount(TrustyTree, { props: { items: ITEMS } })

    expect(rows(wrapper).map(r => r.text())).toEqual(['Rig', 'frame_rate'])
  })

  it('renders expanded branches with one guide segment per ancestor level', () => {
    const wrapper = mount(TrustyTree, {
      props: { items: ITEMS, expanded: ['rig', 'camera'] },
    })

    expect(rows(wrapper).map(r => r.text()))
      .toEqual(['Rig', 'Camera', 'focal_length', 'aperture', 'Light', 'frame_rate'])
    const leaf = rows(wrapper)[2]!
    expect(leaf.findAll('.trusty-tree-guide')).toHaveLength(2)
  })

  it('expands a parent on click and reports it through v-model:expanded', async () => {
    const wrapper = mount(TrustyTree, { props: { items: ITEMS } })

    await rows(wrapper)[0]!.trigger('click')

    expect(wrapper.emitted('update:expanded')?.at(-1)).toEqual([['rig']])
  })

  it('selects a row on click and reports its id through v-model', async () => {
    const wrapper = mount(TrustyTree, { props: { items: ITEMS } })

    await rows(wrapper)[1]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['fps'])
  })

  it('marks the selection and tints its group — parent and siblings — as highlighted', () => {
    const wrapper = mount(TrustyTree, {
      props: { items: ITEMS, expanded: ['rig', 'camera'], modelValue: 'aperture' },
    })
    const byLabel = Object.fromEntries(rows(wrapper).map(r => [r.text(), r]))

    expect(byLabel.aperture!.attributes('data-selected')).toBeDefined()
    expect(byLabel.Camera!.attributes('data-highlighted')).toBeDefined()
    expect(byLabel.focal_length!.attributes('data-highlighted')).toBeDefined()
    expect(byLabel.Rig!.attributes('data-highlighted')).toBeUndefined()
    expect(byLabel.Light!.attributes('data-highlighted')).toBeUndefined()
  })

  it('swaps parent icons between folder and opened-folder', async () => {
    const wrapper = mount(TrustyTree, { props: { items: ITEMS } })

    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:folder')

    await rows(wrapper)[0]!.trigger('click')
    expect(wrapper.findComponent(TrustyIcon).props('name')).toBe('ph:folder-open')
  })

  it('never selects or toggles a disabled row', async () => {
    const items: TrustyTreeItem[] = [
      { id: 'locked', label: 'Locked', disabled: true, children: [{ id: 'in', label: 'Inside' }] },
    ]
    const wrapper = mount(TrustyTree, { props: { items } })
    const row = rows(wrapper)[0]!

    expect(row.attributes('aria-disabled')).toBe('true')

    await row.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('update:expanded')).toBeUndefined()
  })

  it('disables every row when the whole tree is disabled', async () => {
    const wrapper = mount(TrustyTree, { props: { items: ITEMS, disabled: true } })

    expect(rows(wrapper).every(r => r.attributes('data-disabled') !== undefined)).toBe(true)

    await rows(wrapper)[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('chips leaf icons and leaves parent icons bare', () => {
    const wrapper = mount(TrustyTree, {
      props: { items: ITEMS, expanded: ['rig', 'camera'] },
    })
    const byLabel = Object.fromEntries(rows(wrapper).map(r => [r.text(), r]))

    const chip = byLabel.focal_length!.find('.trusty-tree-chip')
    expect(chip.exists()).toBe(true)
    expect(chip.findComponent(TrustyIcon).props('name')).toBe('ph:brackets-curly')

    expect(byLabel.Rig!.find('.trusty-tree-chip').exists()).toBe(false)
    expect(byLabel.Rig!.findComponent(TrustyIcon).props('name')).toBe('ph:folder-open')

    // a leaf without an icon renders label-only
    expect(byLabel.Light!.findComponent(TrustyIcon).exists()).toBe(false)
  })

  it('renders a row\'s color tags in order and skips the group without any', () => {
    const items: TrustyTreeItem[] = [
      { id: 'tagged', label: 'tagged', tags: ['purple', 'mint'] },
      { id: 'plain', label: 'plain' },
    ]
    const wrapper = mount(TrustyTree, { props: { items } })
    const byLabel = Object.fromEntries(rows(wrapper).map(r => [r.text(), r]))

    const tags = byLabel.tagged!.findAll('.trusty-tree-tag')
    expect(tags.map(t => t.attributes('data-color'))).toEqual(['purple', 'mint'])
    expect(byLabel.plain!.find('.trusty-tree-tags').exists()).toBe(false)
  })

  it('reports the right-clicked row so one menu can serve the whole tree', async () => {
    const wrapper = mount(TrustyTree, { props: { items: ITEMS } })

    await rowById(wrapper, 'fps').trigger('contextmenu')

    expect(wrapper.emitted('row-contextmenu')?.at(-1)?.[0]).toMatchObject({ id: 'fps' })
  })

  it('still lets the native right-click reach a parent, menu trigger and all', async () => {
    // Naming that emit `contextmenu` would swallow this listener instead of binding it to the DOM, and hand the parent (item, event) — which breaks any wrapping ContextMenuTrigger.
    const native = vi.fn()
    const wrapper = mount(TrustyTree, {
      props: { items: ITEMS },
      attrs: { onContextmenu: native },
    })

    await rowById(wrapper, 'fps').trigger('contextmenu')

    expect(native).toHaveBeenCalledTimes(1)
    expect(native.mock.calls[0]![0]).toBeInstanceOf(Event)
  })

  describe('dragging', () => {
    it('makes rows draggable only when asked, and never a disabled one', () => {
      const items: TrustyTreeItem[] = [
        { id: 'free', label: 'Free' },
        { id: 'locked', label: 'Locked', disabled: true },
      ]

      const plain = mount(TrustyTree, { props: { items } })
      expect(rowById(plain, 'free').attributes('draggable')).toBe('false')

      const draggable = mount(TrustyTree, { props: { items, draggable: true } })
      expect(rowById(draggable, 'free').attributes('draggable')).toBe('true')
      expect(rowById(draggable, 'locked').attributes('draggable')).toBe('false')
    })

    it('drops before, after, or inside depending on where the row was hit', async () => {
      const cases = [
        { clientY: 2, position: 'before' },
        { clientY: 10, position: 'inside' },
        { clientY: 18, position: 'after' },
      ] as const

      for (const { clientY, position } of cases) {
        const wrapper = mount(TrustyTree, {
          props: { items: ITEMS, draggable: true, expanded: ['rig'] },
        })

        await drag(wrapper, 'fps', 'camera', clientY)

        expect(wrapper.emitted('move')?.at(-1))
          .toEqual([{ id: 'fps', targetId: 'camera', position }])
      }
    })

    it('splits a leaf in half — it models no children, so nothing nests in it', async () => {
      const wrapper = mount(TrustyTree, {
        props: { items: ITEMS, draggable: true, expanded: ['rig', 'camera'] },
      })

      await drag(wrapper, 'fps', 'aperture', 10)

      expect(wrapper.emitted('move')?.at(-1))
        .toEqual([{ id: 'fps', targetId: 'aperture', position: 'after' }])
    })

    it('marks the dragged row and the row under the pointer', async () => {
      const wrapper = mount(TrustyTree, {
        props: { items: ITEMS, draggable: true, expanded: ['rig'] },
      })

      await rowById(wrapper, 'fps').trigger('dragstart')
      await withHeight(rowById(wrapper, 'light')).trigger('dragover', { clientY: 2 })

      expect(rowById(wrapper, 'fps').attributes('data-dragging')).toBeDefined()
      expect(rowById(wrapper, 'light').attributes('data-drop')).toBe('before')

      await rowById(wrapper, 'fps').trigger('dragend')
      expect(rowById(wrapper, 'light').attributes('data-drop')).toBeUndefined()
    })

    it('refuses a drop on the dragged row or anywhere in its own subtree', async () => {
      const wrapper = mount(TrustyTree, {
        props: { items: ITEMS, draggable: true, expanded: ['rig', 'camera'] },
      })

      await drag(wrapper, 'rig', 'rig', 10)
      await drag(wrapper, 'rig', 'focal', 10)

      expect(wrapper.emitted('move')).toBeUndefined()
    })

    it('applies the move to v-model:items and opens the parent it nested into', async () => {
      const wrapper = mount(TrustyTree, {
        props: { items: ITEMS, draggable: true, expanded: ['rig'] },
      })

      await drag(wrapper, 'fps', 'camera', 10)

      const next = wrapper.emitted('update:items')?.at(-1)?.[0] as TrustyTreeItem[]
      expect(next.map(item => item.id)).toEqual(['rig'])
      expect(next[0]!.children![0]!.children!.map(item => item.id))
        .toEqual(['focal', 'aperture', 'fps'])
      expect(wrapper.emitted('update:expanded')?.at(-1)).toEqual([['rig', 'camera']])
    })

    it('leaves the tree it was handed untouched', async () => {
      const items = structuredClone(ITEMS)
      const wrapper = mount(TrustyTree, {
        props: { items, draggable: true, expanded: ['rig'] },
      })

      await drag(wrapper, 'fps', 'camera', 10)

      expect(items).toEqual(ITEMS)
    })

    it('moves the focused row with Ctrl/⌘ + Shift + arrows', async () => {
      // ↑/↓ swap with a sibling, ← moves out past the parent, → nests into the sibling above — each from the same untouched starting tree.
      const cases = [
        { row: 'aperture', key: 'ArrowUp', move: { id: 'aperture', targetId: 'focal', position: 'before' } },
        { row: 'focal', key: 'ArrowDown', move: { id: 'focal', targetId: 'aperture', position: 'after' } },
        { row: 'focal', key: 'ArrowLeft', move: { id: 'focal', targetId: 'camera', position: 'after' } },
        { row: 'light', key: 'ArrowRight', move: { id: 'light', targetId: 'camera', position: 'inside' } },
      ] as const

      for (const { row, key, move } of cases) {
        const wrapper = mount(TrustyTree, {
          props: { items: ITEMS, draggable: true, expanded: ['rig', 'camera'] },
        })

        await rowById(wrapper, row).trigger('keydown', { key, ctrlKey: true, shiftKey: true })

        expect(wrapper.emitted('move')?.at(-1)).toEqual([move])
      }
    })

    it('ignores the arrows without the chord, and at the ends of a branch', async () => {
      const wrapper = mount(TrustyTree, {
        props: { items: ITEMS, draggable: true, expanded: ['rig'] },
      })

      // no modifiers — Reka's own roving focus owns the plain arrows
      await rowById(wrapper, 'fps').trigger('keydown', { key: 'ArrowUp' })
      // already the first root row, and roots have no parent to move out to
      await rowById(wrapper, 'rig').trigger('keydown', { key: 'ArrowUp', ctrlKey: true, shiftKey: true })
      await rowById(wrapper, 'rig').trigger('keydown', { key: 'ArrowLeft', ctrlKey: true, shiftKey: true })

      expect(wrapper.emitted('move')).toBeUndefined()
    })

    it('never drags while the whole tree is disabled', async () => {
      const wrapper = mount(TrustyTree, {
        props: { items: ITEMS, draggable: true, disabled: true, expanded: ['rig'] },
      })

      expect(rowById(wrapper, 'fps').attributes('draggable')).toBe('false')

      await drag(wrapper, 'fps', 'light', 2)
      expect(wrapper.emitted('move')).toBeUndefined()
    })
  })
})

describe('moveTreeItem', () => {
  it('reorders within a list, re-parents, and nests', () => {
    const before = moveTreeItem(ITEMS, { id: 'fps', targetId: 'rig', position: 'before' })
    expect(before.map(item => item.id)).toEqual(['fps', 'rig'])

    const inside = moveTreeItem(ITEMS, { id: 'fps', targetId: 'camera', position: 'inside' })
    expect(inside[0]!.children![0]!.children!.map(item => item.id))
      .toEqual(['focal', 'aperture', 'fps'])

    const out = moveTreeItem(ITEMS, { id: 'focal', targetId: 'rig', position: 'after' })
    expect(out.map(item => item.id)).toEqual(['rig', 'focal', 'fps'])
    expect(out[0]!.children![0]!.children!.map(item => item.id)).toEqual(['aperture'])
  })

  it('returns the tree unchanged for a move that cannot happen', () => {
    const impossible = [
      { id: 'rig', targetId: 'rig', position: 'after' },
      { id: 'rig', targetId: 'focal', position: 'inside' },
      { id: 'nope', targetId: 'rig', position: 'after' },
      { id: 'rig', targetId: 'nope', position: 'after' },
    ] as const

    for (const move of impossible)
      expect(moveTreeItem(ITEMS, move)).toBe(ITEMS)
  })

  it('never mutates the tree it was given', () => {
    const items = structuredClone(ITEMS)

    moveTreeItem(items, { id: 'focal', targetId: 'fps', position: 'inside' })

    expect(items).toEqual(ITEMS)
  })
})
