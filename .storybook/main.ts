import type { StorybookConfig } from '@storybook/vue3-vite'

// Vue SFC compilation comes from the project's vite.config.ts, which the builder loads automatically.
const config: StorybookConfig = {
  framework: '@storybook/vue3-vite',

  stories: [
    '../src/**/*.stories.@(js|ts)',
  ],

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // Runs every story as a Vitest test (see vitest.config.ts) and surfaces the results in the sidebar and the Testing panel.
    '@storybook/addon-vitest',
    'storybook-dark-mode',
  ],
}

export default config
