import { defineConfig } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'
import { sfcOptions } from './sfc-options.ts'

// The library build: one ESM bundle + .d.mts from the single src/index.ts entry.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['es'],
  // Compile the SFCs as a production build, as Vite's library mode does. unplugin-vue otherwise follows NODE_ENV, which `pnpm build` leaves unset, so the published bundle shipped dev-mode output: the builder's absolute path as `__file` in every component, and non-inlined templates whose setup() exposes every binding to the render proxy. The cost: runtime prop declarations shrink to what Boolean casting and defaults need, so a consumer's dev build no longer warns on a wrong prop type — the .d.mts types still catch it. `import.meta.env.DEV` guards pass through untouched and resolve in the consumer's build. Storybook and Vitest keep the dev compile (vite.config.ts).
  plugins: [Vue(sfcOptions({ production: true }))],
  dts: { vue: true },
  // Keep the `import './style.css'` in the built entry, so consumers get the components' own styles just by importing the package — without it the JS and the emitted stylesheet are unlinked and every component renders unstyled. The global stylesheet stays an explicit import (see README "Setup"): it is app-wide, not per-component.
  css: { inject: true },
})
