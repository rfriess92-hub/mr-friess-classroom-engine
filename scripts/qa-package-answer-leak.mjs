#!/usr/bin/env node
import { existsSync } from 'node:fs'
import process from 'node:process'
import { runPackageAnswerLeakQa } from '../engine/qa/package-answer-leak-qa.mjs'
import { argValue, loadJson, repoPath, resolvePackageArg } from './lib.mjs'

const packageArg = argValue('--package')
const fixtureArg = argValue('--fixture')
const resolvedPackageArg = resolvePackageArg(packageArg, fixtureArg)

if (!resolvedPackageArg) {
  console.log('Package answer-leak QA is present.')
  console.log('Usage: node scripts/qa-package-answer-leak.mjs --package <package.proof.json>')
  process.exit(0)
}

const packagePath = repoPath(resolvedPackageArg)
if (!existsSync(packagePath)) {
  console.error(`Package file not found: ${resolvedPackageArg}`)
  process.exit(1)
}

const result = runPackageAnswerLeakQa(loadJson(packagePath))
console.log(JSON.stringify({ package_answer_leak_qa: result }, null, 2))

if (result.blockers.length > 0) process.exit(1)
