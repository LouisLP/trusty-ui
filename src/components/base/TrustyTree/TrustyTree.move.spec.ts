import type { TrustyTreeItem } from './TrustyTree.types'
import { describe, expect, it } from 'vitest'
import {
  treeDropPosition,
  treeItemPath,
  treeMoveForKey,
} from './TrustyTree.move'

// The tree's placement decisions, without a tree.
//
// The drop geometry and the arrow-key mapping, tested without mounting the tree or fabricating DragEvents with a stubbed getBoundingClientRect: both take plain numbers and return a move.
//
// TrustyTree.spec.ts still drives both through a real mount, which is what proves the wiring. This file is for the edges, where the mount tests get expensive: every arrow against every edge of the tree.

const ITEMS: TrustyTreeItem[] = [
  {
    id: 'rig',
    label: 'Rig',
    children: [
      {
        id: 'camera',
        label: 'Camera',
        children: [
          { id: 'focal', label: 'focal_length' },
          { id: 'aperture', label: 'aperture' },
        ],
      },
      { id: 'light', label: 'Light' },
    ],
  },
  { id: 'fps', label: 'frame_rate' },
]

const PARENT: TrustyTreeItem = { id: 'p', label: 'P', children: [] }
const LEAF: TrustyTreeItem = { id: 'l', label: 'L' }
const BOX = { top: 100, height: 20 }

describe('treeItemPath', () => {
  it('reports the chain from the roots down, the row itself last', () => {
    expect(treeItemPath(ITEMS, 'aperture')?.map(item => item.id))
      .toEqual(['rig', 'camera', 'aperture'])
  })

  it('reports a single-element path for a root row', () => {
    expect(treeItemPath(ITEMS, 'fps')?.map(item => item.id)).toEqual(['fps'])
  })

  it('reports nothing for an id the tree does not hold', () => {
    expect(treeItemPath(ITEMS, 'nope')).toBeUndefined()
  })
})

describe('treeDropPosition', () => {
  it('drops before in the top quarter and after in the bottom quarter', () => {
    expect(treeDropPosition(PARENT, BOX, 102)).toBe('before')
    expect(treeDropPosition(PARENT, BOX, 118)).toBe('after')
  })

  it('nests in the middle half of a row that can take children', () => {
    expect(treeDropPosition(PARENT, BOX, 106)).toBe('inside')
    expect(treeDropPosition(PARENT, BOX, 110)).toBe('inside')
    expect(treeDropPosition(PARENT, BOX, 114)).toBe('inside')
  })

  it('splits a leaf in half — it models no children, so nothing nests in it', () => {
    expect(treeDropPosition(LEAF, BOX, 109)).toBe('before')
    expect(treeDropPosition(LEAF, BOX, 111)).toBe('after')
  })

  it('treats a row with an empty children array as nestable', () => {
    // An empty array is how a row says "I hold children, I just have none".
    expect(treeDropPosition({ id: 'e', label: 'E', children: [] }, BOX, 110)).toBe('inside')
  })

  it('falls back to before on a row with no measurable height', () => {
    // A row that has not been laid out divides by zero otherwise.
    expect(treeDropPosition(PARENT, { top: 0, height: 0 }, 50)).toBe('before')
  })

  it('places the thresholds exactly at the quarters', () => {
    expect(treeDropPosition(PARENT, BOX, 105)).toBe('inside') // ratio 0.25, not < 0.25
    expect(treeDropPosition(PARENT, BOX, 115)).toBe('inside') // ratio 0.75, not > 0.75
  })
})

describe('treeMoveForKey', () => {
  it('reorders up and down among siblings', () => {
    expect(treeMoveForKey('ArrowUp', ITEMS, 'aperture'))
      .toEqual({ id: 'aperture', targetId: 'focal', position: 'before' })
    expect(treeMoveForKey('ArrowDown', ITEMS, 'focal'))
      .toEqual({ id: 'focal', targetId: 'aperture', position: 'after' })
  })

  it('lifts a row out to its parent level with left', () => {
    expect(treeMoveForKey('ArrowLeft', ITEMS, 'focal'))
      .toEqual({ id: 'focal', targetId: 'camera', position: 'after' })
  })

  it('nests a row into the sibling above it with right', () => {
    expect(treeMoveForKey('ArrowRight', ITEMS, 'light'))
      .toEqual({ id: 'light', targetId: 'camera', position: 'inside' })
  })

  it('does nothing at the top of a sibling list', () => {
    expect(treeMoveForKey('ArrowUp', ITEMS, 'focal')).toBeUndefined()
  })

  it('does nothing at the bottom of a sibling list', () => {
    expect(treeMoveForKey('ArrowDown', ITEMS, 'aperture')).toBeUndefined()
  })

  it('does nothing lifting a root row out — there is nowhere further out', () => {
    expect(treeMoveForKey('ArrowLeft', ITEMS, 'rig')).toBeUndefined()
  })

  it('does nothing nesting into a sibling that cannot take children', () => {
    // `count` sits above nothing; `force`'s previous sibling `approach` is a leaf, so there is nothing for it to nest into.
    expect(treeMoveForKey('ArrowRight', ITEMS, 'aperture')).toBeUndefined()
  })

  it('does nothing nesting the first row of a list', () => {
    expect(treeMoveForKey('ArrowRight', ITEMS, 'focal')).toBeUndefined()
  })

  it('does nothing for a key that is not an arrow, or an unknown row', () => {
    expect(treeMoveForKey('Enter', ITEMS, 'aperture')).toBeUndefined()
    expect(treeMoveForKey('ArrowUp', ITEMS, 'nope')).toBeUndefined()
  })
})
