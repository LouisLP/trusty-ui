import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { sfcOptions } from './sfc-options.ts'

// The project's canonical Vite config. It is not used to build the library (that's tsdown — see tsdown.config.ts); it exists because the tools that *do* run Vite here expect to find one:
//
// - Storybook (@storybook/vue3-vite) ships no SFC compiler of its own and
// loads this file, so `vue()` must live here or .vue files reach Rollup untransformed ("invalid JS syntax").
// - Vitest merges it in via vitest.config.ts.
export default defineConfig({
  // Same template options as the library build, so specs and stories render what consumers get.
  plugins: [vue(sfcOptions())],

  // STORYBOOK_* env vars reach the browser bundle, matching what `storybook dev` does on its own.
  envPrefix: ['VITE_', 'STORYBOOK_'],
})
