import antfu from '@antfu/eslint-config'

// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'
import { vueOverrides } from './eslint/vue-rules'

export default antfu(
  {
    ignores: [
      '**/*.md',
      '**/*.generated.ts', // codegen output (src/icons inlined SVG markup); not hand-formatted
    ],
    vue: {
      a11y: true,
      overrides: vueOverrides,
    },
    typescript: true,
    formatters: true,
  },
  // Extra flat configs go here, as trailing arguments — NOT as an `extends` key on the options object above. `antfu()`'s options type inherits `extends` from ESLint's `ConfigWithExtends`.
  storybook.configs['flat/recommended'],
)
