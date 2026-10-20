<script setup lang="ts">
import type { TrustyFormField } from './TrustyFormItem.types'
import { computed, useId } from 'vue'
import TrustyIcon from '../../base/TrustyIcon/TrustyIcon.vue'
import TrustyTooltip from '../../base/TrustyTooltip/TrustyTooltip.vue'

const props = withDefaults(defineProps<{
  label?: string
  /** Short explanatory text shown as a tooltip on an info icon next to the label. Use for a hover hint that would clutter the field inline; for always-visible helper text use `hint` instead. Ignored without a `label`. */
  labelTooltip?: string
  /** Helper text shown under the label; linked via aria-describedby. */
  hint?: string
  /** Error message; when set, the field reads as invalid + is announced. */
  error?: string
  required?: boolean
  /** Set for grouped controls (radio/checkbox groups): label via aria-labelledby. */
  group?: boolean
  /** Override the control's id. Supply this when something outside the field needs to reference the control (e.g. TrustyForm's error-summary links); otherwise an id is generated. Ignored for `group` fields. */
  controlId?: string
}>(), {
  required: false,
  group: false,
})

// One base id per field; parts derive from it so label↔control↔hint↔error link.
const baseId = useId()
const controlId = computed(() => props.controlId ?? `${baseId}-control`)
const labelId = computed(() => `${baseId}-label`)
const hintId = computed(() => `${baseId}-hint`)
const errorId = computed(() => `${baseId}-error`)

const hasError = computed(() => Boolean(props.error))

// aria-describedby points at whichever of hint / error is present.
const describedBy = computed(() => {
  const ids = [props.hint ? hintId.value : null, hasError.value ? errorId.value : null]
  const joined = ids.filter(Boolean).join(' ')
  return joined || undefined
})

// The contract handed to the control. Single controls bind `id`; groups bind `aria-labelledby`. `invalid` / `required` drive control styling + native attrs. Typed, not inferred: `TrustyFormField` is what every layer-1 control is checked against by TrustyFormItem.conformance.spec.ts.
const field = computed<TrustyFormField>(() => ({
  ...(props.group
    ? { 'aria-labelledby': props.label ? labelId.value : undefined }
    : { id: controlId.value }),
  'aria-describedby': describedBy.value,
  'invalid': hasError.value,
  'required': props.required,
}))
</script>

<template>
  <div
    class="trusty-form-item"
    :data-invalid="hasError || undefined"
  >
    <div
      v-if="label"
      class="trusty-form-item-label-row"
    >
      <component
        :is="group ? 'span' : 'label'"
        :id="group ? labelId : undefined"
        :for="group ? undefined : controlId"
        class="trusty-form-item-label"
      >
        {{ label }}
        <span
          v-if="required"
          class="trusty-form-item-required"
          aria-hidden="true"
        >*</span>
      </component>

      <!-- Sits outside the label element on purpose: a trigger inside a <label> would proxy clicks to the control. -->
      <TrustyTooltip
        v-if="labelTooltip"
        :text="labelTooltip"
      >
        <button
          type="button"
          class="trusty-form-item-info"
          aria-label="More information"
        >
          <TrustyIcon
            name="ph:info"
            aria-hidden="true"
            size="sm"
          />
        </button>
      </TrustyTooltip>
    </div>

    <p
      v-if="hint"
      :id="hintId"
      class="trusty-form-item-hint"
    >
      {{ hint }}
    </p>

    <div class="trusty-form-item-control">
      <slot :field="field" />
    </div>

    <p
      v-if="hasError"
      :id="errorId"
      class="trusty-form-item-error"
      role="alert"
    >
      <TrustyIcon
        name="ph:warning-circle"
        aria-hidden="true"
      />
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.trusty-form-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.trusty-form-item-label-row {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
}

.trusty-form-item-label {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
}

/* Reset the button chrome so only the info icon shows; keep it keyboard- focusable for the tooltip. */
.trusty-form-item-info {
  display: inline-flex;
  align-items: center;
  padding: 0;
  color: var(--color-text-muted);
  cursor: help;
  background: none;
  border: none;
}

.trusty-form-item-required {
  color: var(--color-danger-text);
}

.trusty-form-item-hint {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-text-muted);
}

/* Small gap before the widget; the label/hint sit tight above it. */
.trusty-form-item-control {
  margin-block-start: var(--space-2xs);
}

.trusty-form-item-error {
  display: flex;
  gap: var(--space-2xs);
  align-items: center;
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-danger-text);
}
</style>
