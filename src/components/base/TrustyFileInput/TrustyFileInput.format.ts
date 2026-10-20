// Byte formatting for the file rows. Binary steps (1024), the unit the design's "547KB" is written in.

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const

/** `560128` → `'547KB'`. Sub-KB stays whole bytes; everything else keeps one decimal only when it needs one. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0)
    return '—'

  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }

  const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded}${UNITS[unit]}`
}
