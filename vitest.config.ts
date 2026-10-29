import { fileURLToPath } from 'node:url'
import storybookTest from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Two test projects, one runner:
//
// unit       — *.spec.ts in jsdom, @vue/test-utils, the fast inner loop.
// storybook  — every *.stories.ts rendered in a real Chromium via Playwright
const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    // Coverage is a root-level concern: one report spanning both projects, so a component covered only by its stories still counts as covered.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'cobertura'],
      reportsDirectory: './coverage',
      // Off by default so watch runs stay fast; CI opts in with `--coverage`.
      enabled: false,
      exclude: [
        'coverage/**',
        'dist/**',
        'scripts/**',
        // Build output of the catalogue, not source under test.
        'storybook-static/**',
        '.storybook/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.generated.ts',
        '**/*.stories.ts',
        '**/index.ts',
        '**/*.spec.{ts,mjs}',
      ],
    },

    projects: [
      // vite.config.ts supplies the Vue plugin; Vitest doesn't auto-load it once this file exists, hence the merge into both projects.
      {
        ...viteConfig,
        test: {
          name: 'unit',
          root: projectRoot,
          environment: 'jsdom',
          // scripts/ too: generate-context is what CI's `context-generated` job gates on.
          include: ['src/**/*.spec.ts', 'scripts/**/*.spec.mjs'],
          exclude: [...configDefaults.exclude, 'e2e/**'],
          // jsdom stubs for the browser APIs Reka UI touches.
          setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
          server: {
            deps: {
              inline: [/reka-ui/, '@internationalized/date'],
            },
          },
        },
      },

      {
        ...viteConfig,
        plugins: [
          ...viteConfig.plugins ?? [],
          // Discovers the stories from .storybook/main.ts's `stories` glob and turns each export into a test.
          await storybookTest({
            configDir: '.storybook',
            // Lets a failing test link straight to the story, and lets watch mode boot the catalogue itself.
            storybookScript: 'pnpm storybook --ci',
            storybookUrl: 'http://localhost:6006',
          }),
        ],
        test: {
          name: 'storybook',
          root: projectRoot,
          // No setupFiles: since Storybook 10.3 the addon applies .storybook/preview.ts's annotations to every story test itself.
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // Every story renders twice, once per colour scheme, so axe and every play() run against both halves of the light-dark() tokens.
            instances: [
              { browser: 'chromium', name: 'storybook (dark)', provider: playwright({ contextOptions: { colorScheme: 'dark' } }) },
              { browser: 'chromium', name: 'storybook (light)', provider: playwright({ contextOptions: { colorScheme: 'light' } }) },
            ],
          },
        },
      },
    ],
  },
})
