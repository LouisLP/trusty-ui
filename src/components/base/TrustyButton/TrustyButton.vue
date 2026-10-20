<script setup lang="ts">
import type { TrustyIconName } from '../../../icons'
import { computed } from 'vue'
import TrustyIcon from '../TrustyIcon/TrustyIcon.vue'

type TrustyButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type TrustyButtonSize = 'sm' | 'md' | 'lg'
type TrustyButtonType = 'button' | 'submit' | 'reset'

const props = withDefaults(defineProps<{
  /** Fill style / colour role. */
  variant?: TrustyButtonVariant
  size?: TrustyButtonSize
  type?: TrustyButtonType
  loading?: boolean
  disabled?: boolean
  block?: boolean
  /** The button text. Omit for an icon-only button (pair with `aria-label`). */
  label?: string
  /** Leading icon (shorthand for `leadingIcon`). Any Iconify `collection:icon` name. */
  icon?: TrustyIconName
  /** Icon BEFORE the label. Takes precedence over `trailingIcon` (one icon only). */
  leadingIcon?: TrustyIconName
  /** Icon AFTER the label. Ignored if a leading icon is also set. */
  trailingIcon?: TrustyIconName
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  block: false,
})

const isDisabled = computed(() => props.disabled || props.loading)

// A button carries at most one icon: the leading one wins, then the trailing.
const leadingIconName = computed(() => props.leadingIcon ?? props.icon)
const trailingIconName = computed(() => (leadingIconName.value ? undefined : props.trailingIcon))
const isIconOnly = computed(() =>
  !props.label && Boolean(leadingIconName.value || trailingIconName.value))
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled || undefined"
    :aria-busy="loading || undefined"
    :data-variant="variant"
    :data-size="size"
    :data-block="block || undefined"
    :data-loading="loading || undefined"
    :data-icon-only="isIconOnly || undefined"
    class="trusty-button"
  >
    <span
      v-if="loading"
      class="trusty-button-affix"
      aria-hidden="true"
    >
      <TrustyIcon
        name="ph:spinner-gap"
        class="trusty-button-spinner"
      />
    </span>
    <span
      v-else-if="leadingIconName"
      class="trusty-button-affix"
    >
      <TrustyIcon :name="leadingIconName" />
    </span>

    <span
      v-if="label"
      class="trusty-button-label"
    >
      {{ label }}
    </span>

    <span
      v-if="trailingIconName && !loading"
      class="trusty-button-affix"
    >
      <TrustyIcon :name="trailingIconName" />
    </span>
  </button>
</template>

<style scoped>
.trusty-button {
  /* Per-instance channels. Each variant paints the resting / -hover / -active / -disabled values below, and the single set of state rules swaps the matching channel in, which keeps every variant to one block. The defaults cover the non-solid variants; each variant overrides what differs. */
  --trusty-button-fg: var(--color-text);
  --trusty-button-fg-hover: var(--color-text);
  --trusty-button-fg-active: var(--color-primary-highlight);
  --trusty-button-fg-disabled: var(--color-text-muted);
  --trusty-button-bg: transparent;
  --trusty-button-bg-hover: transparent;
  --trusty-button-bg-active: transparent;
  --trusty-button-bg-disabled: transparent;
  --trusty-button-border: transparent;
  --trusty-button-border-hover: transparent;
  --trusty-button-border-active: transparent;
  --trusty-button-border-disabled: transparent;

  display: inline-flex;
  gap: var(--space-sm);
  align-items: center;
  justify-content: center;
  min-block-size: var(--size-control-md);
  padding-block: var(--space-xs);
  padding-inline: var(--space-md);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);

  /* single-line control: no extra leading, so flex centering isn't fighting the half-leading that otherwise makes short labels sit optically high */
  line-height: 1;
  color: var(--trusty-button-fg);
  white-space: nowrap;
  text-decoration: none;
  appearance: none;
  cursor: pointer;
  user-select: none;
  background-color: var(--trusty-button-bg);
  border: var(--border-md) solid var(--trusty-button-border);
  border-radius: var(--radius-xs);
  isolation: isolate;
  transition:
    color var(--duration-fast) ease-out,
    background-color var(--duration-fast) ease-out,
    border-color var(--duration-fast) ease-out,
    transform var(--duration-fast) ease-out;
}

/* ── size ── */
.trusty-button[data-size='sm'] {
  gap: var(--space-xs);
  min-block-size: var(--size-control-sm);
  padding-block: var(--space-2xs);
  padding-inline: var(--space-sm);
  font-size: var(--font-size-xs);
}

.trusty-button[data-size='lg'] {
  min-block-size: var(--size-control-lg);
  padding-block: var(--space-sm);
  padding-inline: var(--space-lg);
}

/* ── full width ── */
.trusty-button[data-block='true'] {
  display: flex;
  inline-size: 100%;
}

/* ── icon-only: square it off ── */
.trusty-button[data-icon-only='true'] {
  aspect-ratio: 1;
  padding-inline: 0;
}

/* ── variants: paint the channels (resting + per-state targets) ── */
.trusty-button[data-variant='primary'] {
  --trusty-button-fg: var(--color-on-primary);
  --trusty-button-fg-hover: var(--color-on-primary);
  --trusty-button-fg-active: var(--color-on-primary);
  --trusty-button-fg-disabled: var(--color-text-muted);
  --trusty-button-bg: var(--color-primary);
  --trusty-button-bg-hover: var(--color-primary-hover);
  --trusty-button-bg-active: var(--color-primary-active);
  --trusty-button-bg-disabled: var(--color-primary-disabled);
}

.trusty-button[data-variant='secondary'] {
  --trusty-button-bg: var(--color-secondary);
  --trusty-button-bg-hover: var(--color-secondary-muted);
  --trusty-button-bg-active: var(--color-secondary-muted);
  --trusty-button-bg-disabled: var(--color-secondary);
}

.trusty-button[data-variant='outline'] {
  --trusty-button-border: var(--color-border);
  --trusty-button-border-hover: var(--color-text-muted);
  --trusty-button-border-active: var(--color-primary-highlight);
  --trusty-button-border-disabled: var(--color-border);
}

.trusty-button[data-variant='danger'] {
  --color-danger-highlight: #a3475a;
  --trusty-button-fg-active: var(--color-text);
  --trusty-button-fg-disabled: var(--color-danger-text);
  --trusty-button-bg: var(--color-danger-surface);
  --trusty-button-bg-hover: var(--color-danger-highlight);
  --trusty-button-bg-active: var(--color-danger-surface);
  --trusty-button-bg-disabled: var(--color-danger-surface);
}

.trusty-button[data-variant='ghost'] {
  /* faint primary wash on hover / press */
  --trusty-button-bg-hover: var(--color-ghost-surface-subtle);
  --trusty-button-bg-active: var(--color-ghost-surface-subtle);
}

/* ── states: one rule each, regardless of variant ── */
.trusty-button:hover:not(:disabled) {
  --trusty-button-fg: var(--trusty-button-fg-hover);
  --trusty-button-bg: var(--trusty-button-bg-hover);
  --trusty-button-border: var(--trusty-button-border-hover);
}

.trusty-button:active:not(:disabled) {
  --trusty-button-fg: var(--trusty-button-fg-active);
  --trusty-button-bg: var(--trusty-button-bg-active);
  --trusty-button-border: var(--trusty-button-border-active);

  /* press feedback: a 2% scale-down, reset under reduced-motion below */
  transform: scale(0.98);
}

/* Keyboard focus ring: 2px primary, just outside the border box. Authored on :focus (so the a11y linter sees it paired with :hover), then hidden for pointer focus — only keyboard users see it. */
.trusty-button:focus:not(:disabled) {
  outline: var(--border-md) solid var(--color-primary-highlight);
  outline-offset: var(--space-2xs);
}

.trusty-button:focus:not(:focus-visible) {
  outline-color: transparent;
}

/* Disabled paints muted channels (no opacity — the colours carry the state). */
.trusty-button:disabled,
.trusty-button[aria-disabled='true'] {
  --trusty-button-fg: var(--trusty-button-fg-disabled);
  --trusty-button-bg: var(--trusty-button-bg-disabled);
  --trusty-button-border: var(--trusty-button-border-disabled);

  cursor: not-allowed;
}

/* loading reads as busy: keep the resting fill, swap the cursor */
.trusty-button[data-loading='true'] {
  cursor: progress;
}

/* ── parts ── */
.trusty-button-affix {
  /* Icon rides at 1.25× the label (TrustyIcon defaults to 1em of this box), so it stays proportional across sm/md/lg — ~15px at sm, ~17.5px at md/lg. */
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- icon at 1.25× the label */
  font-size: 1.25em;
}

.trusty-button-label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trusty-button-spinner {
  animation: trusty-button-spin var(--duration-deliberate) linear infinite;
}

@keyframes trusty-button-spin {
  to {
    transform: rotate(360deg);
  }
}

/* honor reduced-motion: no transitions, no press scale, no spin */
@media (prefers-reduced-motion: reduce) {
  .trusty-button {
    transition: none;
  }

  .trusty-button:active:not(:disabled) {
    transform: none;
  }

  .trusty-button-spinner {
    animation: none;
  }
}
</style>
