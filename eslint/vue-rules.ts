import type { TypedFlatConfigItem } from '@antfu/eslint-config'

/**
 * House Vue + accessibility rule tuning, layered over @antfu/eslint-config's `vue` preset. Spread into `antfu({ vue: { a11y: true, overrides: vueOverrides } })`.
 *
 * The `satisfies` is load-bearing: without a contextual type TS widens each `['error', {...}]` to `(string | {...})[]`, and a plain array is not the tuple `[Severity, ...any[]]` that `Rules` requires.
 */
export const vueOverrides = {
  'vue/no-undef-components': ['error', {
    ignorePatterns: ['router-link', 'router-view', 'primitive'],
  }],
  'vue/no-undef-properties': ['error'],
  'vue/no-unused-properties': ['error'],
  'vue/no-unused-emit-declarations': ['error'],
  'vue/no-constant-condition': ['error'],
  'vue/no-console': ['error'],
  'vue/enforce-style-attribute': ['error', { allow: ['scoped'] }],
  'vue/no-static-inline-styles': ['error'],
  'vue/component-api-style': ['error', ['script-setup']],
  // Styles must be plain CSS using the var(--token) custom properties from src/styles/tokens.css.
  'vue/block-lang': ['error', {
    script: {
      lang: 'ts',
    },
    style: {
      lang: 'css',
      allowNoLang: true,
    },
  }],
  'vue/define-emits-declaration': ['warn', 'type-literal'],
  'vue/define-props-declaration': ['warn', 'type-based'],
  'vue/define-props-destructuring': ['warn', {
    destructure: 'never',
  }],
  'vue/prefer-true-attribute-shorthand': ['warn', 'never'],
  'vue/prefer-use-template-ref': ['warn'],
  'vue/slot-name-casing': ['warn', 'camelCase'],
  'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
  'vue/attribute-hyphenation': ['warn', 'always'],
  'vue/max-attributes-per-line': ['warn', {
    singleline: {
      max: 1,
    },
  }],
  'vue/custom-event-name-casing': 'off',

  'vue-a11y/click-events-have-key-events': 'off',
  'vue-a11y/interactive-supports-focus': 'off',
} satisfies TypedFlatConfigItem['rules']
