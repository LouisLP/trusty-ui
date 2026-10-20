// SFC compile options shared by every tool that compiles .vue here: plugin-vue (vite.config.ts, so Storybook and Vitest) and unplugin-vue (tsdown.config.ts, the library build).
//
// Template comments are dropped because a comment beside the root element (the usual `<!-- eslint-disable-next-line … -->`) turns the root into a Fragment, and only Vue's dev runtime looks through that Fragment for attrs fallthrough; a consumer's production build drops every non-prop attr (id, aria-*, data-*, class).
//
// `production` is the only thing that varies: the library build forces it (see tsdown.config.ts); left out, plugin-vue follows Vite's own mode.
export function sfcOptions({ production = false } = {}) {
  return {
    ...(production && { isProduction: true }),
    template: { compilerOptions: { comments: false } },
  }
}
