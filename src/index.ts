// Trusty UI — public entry. One export surface for the whole library (consumers import from '@louislp/trusty-ui'; never deep-import src/). Prop types live on the component; consumers can read them with `ComponentProps<typeof TrustyButton>` from Vue if needed.
//
// Components are organized by composition depth under src/components/ (base/specialized/form/composites — see CONTEXT.md). Those folders are internal organization only: there are deliberately no per-category subpath exports, so this flat barrel is the whole public surface.
export * from './components/base'
export * from './components/composites'
export * from './components/form'
export * from './components/specialized'

// The icons the components use are bundled — <TrustyIcon> renders them offline and fetches any other Iconify name. The name type is for consumers typing their own `icon` props. See src/icons/README.md.
export type { TrustyIconName } from './icons'
