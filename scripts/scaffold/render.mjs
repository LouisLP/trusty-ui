// The scaffold: one new component's files, rendered from its name and depth. Pure — the current category index comes in as a string and the updated one goes out — so it is tested by calling it. new-component.mjs is the wiring.
//
// What it renders is the shape the inventory spec and the guidance gate demand, with every judgement call left as a TODO the guidance gate refuses to ship.
import { COMPONENTS_DIR, DEPTH_BY_FOLDER } from '../roster.mjs'

const FOLDER_BY_DEPTH = Object.fromEntries(
  Object.entries(DEPTH_BY_FOLDER).map(([folder, depth]) => [depth ?? 'private', folder]),
)

export const DEPTHS = Object.keys(FOLDER_BY_DEPTH)

/** `TrustyThing` → `trusty-thing`. */
export function kebab(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Why `name` cannot be scaffolded at `depth`, or null when it can. */
export function invalidReason(name, depth) {
  if (!DEPTHS.includes(depth))
    return `unknown depth "${depth}" — one of: ${DEPTHS.join(', ')}`
  if (!/^[A-Z][a-zA-Z0-9]+$/.test(name))
    return `"${name}" is not PascalCase`
  if (depth !== 'private' && !/^Trusty[A-Z]/.test(name))
    return `a public component is named Trusty…, not "${name}"`
  if (depth === 'private' && name.startsWith('Trusty'))
    return `a private component never carries the Trusty prefix, which marks the public surface`
  return null
}

/** `{ path: contents }` for every file the new component adds or changes. `index` is the category index.ts as it stands; omitted for `private`, which has none. */
export function renderScaffold({ name, depth, index = '' }) {
  const folder = FOLDER_BY_DEPTH[depth]
  const dir = `${COMPONENTS_DIR}/${folder}/${name}`
  const cls = kebab(name)
  const files = {
    [`${dir}/${name}.vue`]: vue(name, cls, depth),
    [`${dir}/${name}.spec.ts`]: spec(name, cls),
  }
  if (depth === 'private')
    return files

  files[`${dir}/${name}.stories.ts`] = stories(name)
  files[`${COMPONENTS_DIR}/${folder}/index.ts`] = `${index.trimEnd()}\nexport { default as ${name} } from './${name}/${name}.vue'\n`
  files[`.changeset/${cls}.md`] = changeset(name)
  return files
}

function vue(name, cls, depth) {
  const banner = depth === 'private'
    ? `// PRIVATE — NOT exported from the library. TODO: which public components wrap this, and what it holds for them.\n\n`
    : ''
  return `<script setup lang="ts">
${banner}withDefaults(defineProps<{
  /** TODO: the one prop this component cannot do without, or delete. */
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})
</script>

<template>
  <div
    class="${cls}"
    :data-size="size"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Semantic tokens only — CONTEXT.md "Token tiers". */
.${cls} {
  display: flex;
  gap: var(--space-sm);
  color: var(--color-text);
}
</style>
`
}

function spec(name, cls) {
  return `import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ${name} from './${name}.vue'

describe('${name[0].toLowerCase()}${name.slice(1)}', () => {
  it('renders its default slot at size md by default', () => {
    const wrapper = mount(${name}, { slots: { default: 'Content' } })
    const root = wrapper.get('.${cls}')

    expect(root.attributes('data-size')).toBe('md')
    expect(root.text()).toBe('Content')
  })
})
`
}

function stories(name) {
  return `import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ${name} from './${name}.vue'

const meta = {
  title: 'TODO/${name}',
  component: ${name},
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: \`
TODO: one paragraph — what this is, and what it renders.

**Use it when**
- TODO: the situation that calls for it.

**Don't use it for**
- TODO: the nearest wrong choice, and the component to reach for instead.
\`,
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: {
    size: 'md',
  },
  render: args => ({
    components: { ${name} },
    setup: () => ({ args }),
    template: \`<${name} v-bind="args">Content</${name}>\`,
  }),
} satisfies Meta<typeof ${name}>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
`
}

function changeset(name) {
  return `---
"@louislp/trusty-ui": minor
---

${name}: TODO — what it is, in one sentence a consumer can choose on.
`
}
