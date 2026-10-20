<script setup lang="ts">
// Public add / remove tag chip. Thin skin over the private TagBase: this component owns only the glyph and the accessible label that name the one action clicking it performs. A chip that switches on and off is TrustyFilterTag, which skins the same base.

import type { TrustyTagAction, TrustyTagColor } from './TrustyTag.types'
import TagBase from '../../private/TagBase/TagBase.vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

// aria-label is bound before $attrs on TagBase, so a consumer's own label wins.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** Tag text. Plain string only: keeps every tag on the design system. */
  label: string
  /** Which of the seven hues to paint. Decorative — the app decides what a hue means. */
  color?: TrustyTagColor
  /** Whether clicking adds this tag (leading `+`) or removes it (trailing `×`). */
  action?: TrustyTagAction
  disabled?: boolean
}>(), {
  color: 'blue',
  action: 'remove',
  disabled: false,
})

// Declared, not left to fall through: an undeclared event never reaches autodocs.
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <TagBase
    :label="label"
    :color="color"
    :disabled="disabled"
    :data-action="action"
    :aria-label="`${props.action === 'add' ? 'Add' : 'Remove'} ${props.label}`"
    v-bind="$attrs"
    @click="emit('click', $event)"
  >
    <template
      v-if="action === 'add'"
      #leading
    >
      <TrustyIcon
        name="ph:plus"
        size="sm"
        class="trusty-tag-icon"
      />
    </template>
    <template
      v-if="action === 'remove'"
      #trailing
    >
      <TrustyIcon
        name="ph:x"
        size="sm"
        class="trusty-tag-icon"
      />
    </template>
  </TagBase>
</template>

<style scoped>
.trusty-tag-icon {
  flex: none;
}
</style>
