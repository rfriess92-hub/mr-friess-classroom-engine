## PR class
Choose one:
- [ ] Content
- [ ] Renderer
- [ ] QA
- [ ] Tooling

## Rule
This PR must stay inside one primary class unless it is explicitly reclassified.

## Required action
Complete the matching section below.

---

## Content PR

### Scope
- briefs:
- packages:
- fixtures:

### Why this PR exists
Describe the package or proof being added.

### Stable-core workflow run
- [ ] `pnpm run schema:check -- --package <path>`
- [ ] `pnpm run route:plan -- --package <path> --print-routes`
- [ ] `pnpm run render:package -- --package <path> --out output`
- [ ] `pnpm run qa:bundle -- --package <path> --out output`

### Expected outputs
- [ ] teacher-only outputs sane
- [ ] student-facing outputs sane
- [ ] shared-view outputs sane
- [ ] final evidence location declared once unless explicitly allowed otherwise

### Defects found during review
List each defect with classification:
- `content_problem`:
- `renderer_problem`:
- `repo_tooling_problem`:

### Explicit non-goals
- [ ] No renderer changes
- [ ] No QA rule changes
- [ ] No tooling/path changes

---

## Renderer PR

### Defect being fixed
Describe the visible artifact defect.

### Defect classification
- [ ] `renderer_problem`

### Exposed by
Link the content PR, fixture, or proof package that exposed the problem.

### Files changed
- `engine/...`
- `templates/...`

### Smallest safe change
Explain why this is the minimum valid renderer fix.

### Regression coverage
Packages rerun:
- affected package:
- prior known package:

### Stable-core workflow run
- [ ] rerender affected package
- [ ] rerender prior package
- [ ] rerun bundle QA where applicable

### Explicit non-goals
- [ ] No package content rewriting to dodge renderer behavior
- [ ] No unrelated QA changes
- [ ] No unrelated tooling changes

---

## QA PR

### Historical defect targeted
Describe the known defect this check is intended to catch.

### Defect classification
- [ ] `renderer_problem`
- [ ] `content_problem`
- [ ] `repo_tooling_problem`

### New guardrail
Describe the exact check being added.

### Why this belongs in QA
Explain why the renderer/content/tooling behavior is already understood and now needs enforcement.

### Proof of value
- defect this rule would have caught:
- expected pass cases checked:

### Explicit non-goals
- [ ] No renderer redesign
- [ ] No content rewrite
- [ ] No silent loosening of acceptance

---

## Tooling PR

### Problem being fixed
Describe the operator or pipeline confusion/failure.

### Defect classification
- [ ] `repo_tooling_problem`

### Files changed
- `scripts/...`
- `engine/...`

### Stable-core workflow impact
Explain how this affects:
- `schema:check`
- `route:plan`
- `render:package`
- `qa:bundle`

### Explicit non-goals
- [ ] No pedagogy changes
- [ ] No hidden renderer fixes
- [ ] No hidden content rewrites
