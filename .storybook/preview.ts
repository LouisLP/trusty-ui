import type { Preview } from '@storybook/vue3-vite'
import { DocsContainer } from '@storybook/addon-docs/blocks'
import { createElement } from 'react'
import { useDarkMode } from 'storybook-dark-mode'
import { themes } from 'storybook/theming'

import '../src/styles/main.css'
import './preview.css'

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

// The same chrome, from the light half of each token's light-dark() pair.
const trustyLight = {
  ...themes.light,
  appBg: '#e5e8ec', // --color-bg-lowered (sumi-100)
  appContentBg: '#e5e8ec', // --color-bg-lowered
  appPreviewBg: '#e5e8ec', // --color-bg-lowered
  appBorderColor: '#c9ced4', // --color-border
  barBg: '#f3f5f8', // --color-bg
  colorSecondary: '#b4472a', // --color-primary
  textColor: '#040609', // --color-text
  textMutedColor: '#3f4953', // --color-text-muted
  brandTitle: 'Trusty UI',
}

// Docs pages render inside the preview iframe with their OWN theme
function ThemedDocsContainer(props: { context: any, children?: any }) {
  return createElement(DocsContainer, {
    ...props,
    theme: useDarkMode() ? trustyDark : trustyLight,
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
    // The tokens carry both modes, so the dark-mode toggle switches the canvas too; a backgrounds picker would only fight it.
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

    // storybook-dark-mode themes the Storybook chrome, and through preview.css the stories: the class it sets on the preview's <html> pins color-scheme.
    darkMode: {
      current: 'dark',
      dark: trustyDark,
      light: trustyLight,
      classTarget: 'html',
      darkClass: 'trusty-dark',
      lightClass: 'trusty-light',
      stylePreview: true,
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
