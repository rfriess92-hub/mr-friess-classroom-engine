import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { FIXTURE_MAP, argValue, loadJson, repoPath } from './lib.mjs'
import { buildFontFaceCSS, buildDesignSystemCSS } from '../engine/pdf-html/templates/shared.mjs'
import { buildWeeklyOverviewHTML } from '../engine/pdf-html/templates/weekly-overview.mjs'

// Collect package paths from --packages and/or --fixture flags.
function resolvePackagePaths() {
  const paths = []

  // --packages path1,path2,...
  const packagesArg = argValue('--packages')
  if (packagesArg) {
    for (const p of packagesArg.split(',').map((s) => s.trim()).filter(Boolean)) {
      paths.push(repoPath(p))
    }
  }

  // --fixture key (repeatable: --fixture benchmark1 --fixture careers8_clusters)
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--fixture') {
      const key = process.argv[i + 1]
      const mapped = FIXTURE_MAP[key]
      if (!mapped) {
        console.error(`Unknown fixture key: ${key}`)
        console.error(`Available: ${Object.keys(FIXTURE_MAP).join(', ')}`)
        process.exit(1)
      }
      paths.push(repoPath(mapped))
      i++
    }
  }

  return paths
}

function detectDeclaredOutputs(pkg) {
  // Prefer bundle.declared_outputs; fall back to outputs array
  if (Array.isArray(pkg.bundle?.declared_outputs)) return pkg.bundle.declared_outputs
  if (Array.isArray(pkg.outputs)) return pkg.outputs.map((o) => o.output_type).filter(Boolean)
  return []
}

function extractSummary(pkg) {
  const phases = pkg.pacing_guide?.phases ?? []
  return {
    topic: pkg.topic ?? pkg.package_id ?? 'Lesson',
    subject: pkg.subject ?? null,
    grade: pkg.grade ?? null,
    learning_goals: pkg.teacher_guide?.learning_goals ?? [],
    materials: pkg.teacher_guide?.materials ?? [],
    phases,
    declared_outputs: detectDeclaredOutputs(pkg),
    standards: Array.isArray(pkg.standards) ? pkg.standards : [],
  }
}

async function renderHtmlToPdf(html, outPath) {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch (error) {
    throw new Error(`Playwright is not installed. Run: pnpm install && pnpm run fonts:install\n${error.message}`)
  }
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })
    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
  } finally {
    await browser.close()
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const packagePaths = resolvePackagePaths()

if (packagePaths.length === 0) {
  console.log('Weekly Overview generator — produces a single-page week-at-a-glance PDF.')
  console.log()
  console.log('Usage:')
  console.log('  pnpm run weekly:overview -- --fixture benchmark1 --fixture careers8_clusters [--week-label "Week 1"] [--out output]')
  console.log('  pnpm run weekly:overview -- --packages fixtures/core/benchmark-1.grade2-math.json,fixtures/core/challenge-7.grade8-sequence.json')
  console.log()
  console.log(`Fixture shortcuts: ${Object.keys(FIXTURE_MAP).join(', ')}`)
  process.exit(0)
}

for (const p of packagePaths) {
  if (!existsSync(p)) {
    console.error(`Package file not found: ${p}`)
    process.exit(1)
  }
}

const weekLabel = argValue('--week-label') ?? ''
const outDir = repoPath(argValue('--out') ?? 'output')
mkdirSync(outDir, { recursive: true })

const summaries = packagePaths.map((p) => extractSummary(loadJson(p)))

console.log(`Building weekly overview for ${summaries.length} package${summaries.length !== 1 ? 's' : ''}${weekLabel ? ` — ${weekLabel}` : ''}`)

const html = buildWeeklyOverviewHTML(summaries, weekLabel, buildFontFaceCSS(), buildDesignSystemCSS())

const outPath = resolve(outDir, `weekly-overview${weekLabel ? `-${weekLabel.toLowerCase().replace(/\s+/g, '-')}` : ''}.pdf`)
await renderHtmlToPdf(html, outPath)

console.log(`Written: ${outPath}`)
