import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const TOKENS_PATH = resolve(__dir, '../visual/config/tokens.json')

let _config = null

function loadTokenConfig() {
  if (_config) return _config
  _config = JSON.parse(readFileSync(TOKENS_PATH, 'utf-8'))
  return _config
}

function mergeTokenSet(sets, id) {
  const set = sets[id]
  if (!set) return sets.baseline_default ?? {}
  if (!set.extends) return set
  const base = mergeTokenSet(sets, set.extends)
  return deepMerge(base, set.overrides ?? {})
}

function deepMerge(base, overrides) {
  const out = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key]) {
      out[key] = deepMerge(base[key], value)
    } else {
      out[key] = value
    }
  }
  return out
}

export function resolveTokenSet(tokenSetId = 'baseline_default') {
  const config = loadTokenConfig()
  return mergeTokenSet(config.token_sets, tokenSetId)
}

export function tokensToCss(tokens) {
  const c = tokens.color ?? {}
  const t = tokens.type ?? {}
  const s = tokens.space ?? {}
  const r = tokens.radius ?? {}
  const st = tokens.stroke ?? {}

  return `
    --color-ink-primary: ${c.ink_primary ?? '#1F355E'};
    --color-ink-secondary: ${c.ink_secondary ?? '#344054'};
    --color-paper: ${c.paper ?? '#FCFBF8'};
    --color-panel: ${c.panel ?? '#F3F0EA'};
    --color-panel-alt: ${c.panel_alt ?? '#EEE8DD'};
    --color-support: ${c.support ?? '#D98B3A'};
    --color-reflection: ${c.reflection ?? '#6D9C95'};
    --color-extension: ${c.extension ?? '#6E6A9E'};
    --color-success: ${c.success ?? '#7A8A5B'};
    --color-line: ${c.line ?? '#C8C2B8'};

    --font-family: ${t.font_family ?? 'Inter, Aptos, Arial, sans-serif'};
    --font-size-title: ${t.title_size ?? 28}px;
    --font-size-subtitle: ${t.subtitle_size ?? 18}px;
    --font-size-section-label: ${t.section_label_size ?? 12}px;
    --font-size-body: ${t.body_size ?? 12}px;
    --font-size-small: ${t.small_size ?? 10}px;
    --font-weight-title: ${t.title_weight ?? 700};
    --font-weight-section: ${t.section_weight ?? 600};
    --font-weight-body: ${t.body_weight ?? 400};
    --line-height: ${t.line_height ?? 1.3};

    --space-xxs: ${s.xxs ?? 4}px;
    --space-xs: ${s.xs ?? 8}px;
    --space-sm: ${s.sm ?? 12}px;
    --space-md: ${s.md ?? 16}px;
    --space-lg: ${s.lg ?? 24}px;
    --space-xl: ${s.xl ?? 32}px;
    --space-xxl: ${s.xxl ?? 48}px;

    --radius-sharp: ${r.sharp ?? 2}px;
    --radius-soft: ${r.soft ?? 8}px;
    --radius-round: ${r.round ?? 14}px;

    --stroke-thin: ${st.thin ?? 1}px;
    --stroke-medium: ${st.medium ?? 1.5}px;
    --stroke-heavy: ${st.heavy ?? 2}px;
  `.trim()
}
