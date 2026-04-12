export function deriveBundleJudgment({ blockers, findings }) {
  const hardFailure = blockers.length > 0
  const softFailure = findings.length > 0
  const judgment = hardFailure ? 'block' : softFailure ? 'revise' : 'pass'
  const shipRule = hardFailure ? 'rebuild_before_shipping' : judgment === 'pass' ? 'ship' : 'patch_then_ship'
  return { hardFailure, softFailure, judgment, shipRule }
}
