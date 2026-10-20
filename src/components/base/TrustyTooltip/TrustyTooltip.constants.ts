/**
 * Max characters for TrustyTooltip's `text` prop. Tooltips are short hints, not descriptions — a longer string is almost always a sign of the wrong component. Shared by two independent checks so they can't drift apart:
 * - TrustyTooltip.vue: dev-only runtime warning (catches bound `:text="expr"`)
 * - eslint/trusty-ui-rules.ts: static lint error (catches literal `text="…"`)
 */
export const TOOLTIP_TEXT_MAX = 125
