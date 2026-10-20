// Types for roster.mjs, for the specs under src/ that read it.
export type TrustyDepth = 'base' | 'specialized' | 'form' | 'composite'

export interface RosterEntry {
  name: string
  folder: string
  /** `null` for `private`. */
  depth: TrustyDepth | null
  public: boolean
  dir: string
  vue: string | null
  spec: string | null
  stories: string | null
}

export declare const DEPTH_BY_FOLDER: Record<string, TrustyDepth | null>
export declare const COMPONENTS_DIR: string
export declare function readRoster(root: string): RosterEntry[]
export declare function splitGuidance(description: string): { useWhen: string[], dontUseFor: string[] }
