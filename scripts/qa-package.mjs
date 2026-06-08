#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { planPackageRoutes } from '../engine/planner/output-router.mjs'
import { buildRenderedPackageContractQa, writeRenderedPackageContractQa } from '../engine/render/rendered-package-contract-qa.mjs'
import { argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const outArg = argValue('--out') ?? 'output'
const flatOut = process.argv.includes('--flat-out')
const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.error('Usage: pnpm run qa:package -- --package <package-json> --out <output-dir> [--flat-out]')
  process.exit(1)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const pkg = loadJson(packagePath)
const { validation, render_plan: renderPlan, routes } = planPackageRoutes(pkg)
if (!validation.valid) {
  console.error('Package validation failed. Run schema:check first.')
  process.exit(1)
}

const baseOutDir = repoPath(outArg)
const candidateOutDir = flatOut ? baseOutDir : resolve(baseOutDir, renderPlan.package_id ?? 'package')
const outDir = existsSync(candidateOutDir) ? candidateOutDir : baseOutDir
const routeBundles = routes.map((route) => ({ route }))
const qa = buildRenderedPackageContractQa({ pkg, renderPlan, routeBundles, outDir })
writeRenderedPackageContractQa(outDir, qa)

if (qa.judgment === 'block') {
  console.error(`Rendered package contract QA failed for package ${renderPlan.package_id}.`)
  for (const check of qa.checks.filter((entry) => entry.status !== 'pass')) {
    console.error(` - ${check.check_id}: ${check.detail}`)
  }
  process.exit(1)
}

console.log(`Rendered package contract QA passed for package ${renderPlan.package_id}.`)
