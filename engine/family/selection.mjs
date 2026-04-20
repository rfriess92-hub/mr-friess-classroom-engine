// Compatibility-only module.
//
// The live stable-core render-plan and schema-check path now run through
// engine/assignment-family/* instead of engine/family/*.
//
// This file is retained only for transitional compatibility with any
// remaining external callers that still import the historical selection
// surface directly. Prefer engine/assignment-family/* for all new work.

export { selectAssignmentFamilyFromPackage as selectAssignmentFamily } from '../assignment-family/package-selector.mjs'
