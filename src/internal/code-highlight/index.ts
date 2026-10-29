/**
 * Shiki-backed code highlighting, Vue-free like `src/icons`. TrustyCodeBlock draws `highlightToHtml` in read mode; CodeEditorBase turns `tokenizeCode` into CodeMirror decorations. One highlighter instance serves both, so crossing between the modes loads nothing twice.
 *
 * Nothing here is exported from the library except `TrustyCodeLanguage`, the union both components take as a prop.
 *
 * The fine-grained core bundle: the JS regex engine (no WASM), one theme, and per-language grammars registered on demand. Both callers import this module dynamically, so Shiki stays out of bundles that never highlight anything.
 */

import type { HighlighterCore, ThemedToken } from 'shiki/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import ayuMirage from 'shiki/themes/ayu-mirage.mjs'

// The small language set the app actually uses. Extend the map, and thereby the TrustyCodeLanguage union, when a real need appears.
const LANGUAGE_LOADERS = {
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
}

/** Languages the code components can label and highlight. */
export type TrustyCodeLanguage = keyof typeof LANGUAGE_LOADERS

// Ayu Mirage: orange and amber keywords that echo the accent, and every token colour but comments clears 4.5:1 on the sumi inset the code sits on.
const THEME = ayuMirage.name ?? 'ayu-mirage'

let highlighterPromise: Promise<HighlighterCore> | undefined

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    langs: [],
    themes: [ayuMirage],
    // Forgiving: a pattern the JS engine can't compile degrades that token's highlighting instead of throwing for the whole block.
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return highlighterPromise
}

async function loadLanguage(language: TrustyCodeLanguage): Promise<HighlighterCore> {
  const highlighter = await getHighlighter()
  if (!highlighter.getLoadedLanguages().includes(language)) {
    await highlighter.loadLanguage(LANGUAGE_LOADERS[language])
  }
  return highlighter
}

/** Highlight `code` as `language`. Resolves to Shiki-escaped token markup with no `<pre>`/`<code>` wrappers, so it is safe to render via v-html inside the caller's own elements. */
export async function highlightToHtml(code: string, language: TrustyCodeLanguage): Promise<string> {
  const highlighter = await loadLanguage(language)

  return highlighter.codeToHtml(code, {
    lang: language,
    theme: THEME,
    structure: 'inline',
  })
}

/** Tokenize `code` as `language`: one array of themed tokens per line, in document order, carrying the theme's colour and font style. The caller owns the rendering. */
export async function tokenizeCode(code: string, language: TrustyCodeLanguage): Promise<ThemedToken[][]> {
  const highlighter = await loadLanguage(language)

  return highlighter.codeToTokens(code, { lang: language, theme: THEME }).tokens
}
