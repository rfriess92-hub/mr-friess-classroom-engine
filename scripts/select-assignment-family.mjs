import { existsSync } from 'node:fs'
import process from 'node:process'
import { selectAssignmentFamily } from '../engine/assignment-family/selector.mjs'
import { recommendFamilyChains } from '../engine/assignment-family/chains.mjs'
import { argValue, loadJson, repoPath } from './lib.mjs'

const inputArg = argValue('--input')
if (!inputArg) {
  console.log('Usage: node scripts/select-assignment-family.mjs --input path/to/signals.json')
  process.exit(0)
}

const inputPath = repoPath(inputArg)
if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputArg}`)
  process.exit(1)
}

const input = loadJson(inputPath)
const selection = selectAssignmentFamily(input)
const recommendedChains = recommendFamilyChains(selection.selected_family, selection.ranked_families)

console.log(JSON.stringify({
  assignment_family_selection: {
    input,
    selection,
    recommended_chains: recommendedChains,
  }
}, null, 2))
