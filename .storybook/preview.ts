import type { Preview } from '@storybook/vue3-vite'
import { DocsContainer } from '@storybook/addon-docs/blocks'
import { createElement } from 'react'
import { useDarkMode } from 'storybook-dark-mode'
import { themes } from 'storybook/theming'

import '../src/styles/main.css'

// Storybook chrome tinted to match the design tokens.
const trustyDark = {
  ...themes.dark,
  appBg: '#090e13', // --color-bg-lowered (sumi-900)
  appContentBg: '#090e13', // --color-bg-lowered
  appPreviewBg: '#090e13', // --color-bg-lowered
  appBorderColor: '#262f38', // --color-border
  barBg: '#0f141a', // --color-bg
  colorSecondary: '#f0834e', // --color-primary
  textColor: '#f3f5f8', // --color-text
  textMutedColor: '#a4acb4', // --color-text-muted
  brandTitle: 'Trusty UI',
}

// Docs pages render inside the preview iframe with their OWN theme
function ThemedDocsContainer(props: { context: any, children?: any }) {
  return createElement(DocsContainer, {
    ...props,
    theme: useDarkMode() ? trustyDark : themes.light,
  })
}

const preview: Preview = {
  // Wrap every story so it inherits the app's base typography.
  decorators: [
    story => ({
      components: { story },
      template:
        '<div style="font-family: var(--font-family-sans); color: var(--color-text)"><story /></div>',
    }),
  ],

  parameters: {
    // The design system is dark-only: semantic.css defines one :root block with no light variant
    backgrounds: { disabled: true },

    // axe-core runs against every story, in the Storybook UI and under `pnpm test:storybook`, and any violation fails the story's test.
    a11y: {
      test: 'error',
      context: {
        // Reka's toast viewport flanks itself with two tabbable, aria-hidden sentinels that catch Tab and hand focus into the stack. They're its focus management, not content, and axe can't tell them from a hidden button.
        exclude: ['[role="region"][aria-label^="Notifications"] > [aria-hidden="true"][tabindex="0"]'],
      },
    },

    docs: { container: ThemedDocsContainer },

    // storybook-dark-mode themes the Storybook CHROME
    darkMode: {
      current: 'dark',
      dark: trustyDark,
      light: themes.light,
    },

    // Pin the Introduction doc as the sidebar's first entry instead of default alphabetical sort.
    options: {
      storySort: {
        order: ['Introduction', '*'],
      },
    },
  },
}

export default preview
