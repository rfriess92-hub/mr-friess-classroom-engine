# Psychology 11/12 v5 — Tool Decision Rules

Tools enter the course only when they solve a named instructional, source, accessibility, or maintenance problem. The tool never creates curriculum by itself.

| Tool / source | Status | Use when | Do not use when | Required fallback / boundary |
|---|---|---|---|---|
| Zotero | ADOPT NOW | Capturing source metadata, DOI/URL, quotes, visual rights, unit/lesson tags, review dates | Storing student data, secure assessments, controlled reveals | Manual source-register export remains possible |
| lychee | ADOPT NOW — PILOT | Monthly checking of non-secure URLs in the v5 resource list | Checking private Classroom/school URLs or treating every automated failure as a true broken link | Manual review of false positives; source record carries fallback |
| PsyToolkit | PREFERRED READY DEMO | A ready behavioural demonstration directly serves a scheduled lesson | A custom experiment is being built merely because it is possible | No identifying data; static/manual fallback |
| JASP | SELECTIVE ADOPT | A small authentic dataset materially improves correlation/descriptive/data-literacy learning | The lesson becomes software training or requires installation friction | Static table/plot fallback; teacher demo is acceptable |
| OpenIntro / PsyTeachR datasets | SOURCE BANK | Small de-identified datasets provide useful context for methods/data interpretation | Importing university-level statistics curriculum wholesale | Review dataset context, licence and sensitivity; keep only needed subset |
| draw.io | ADOPT SELECTIVELY | A custom process/relationship diagram is clearer than text or an existing licensed figure | Every concept is being converted into a bespoke diagram | Keep editable source + exported image + alt text/source record |
| Openverse | SOURCE BANK | Discovering openly licensed visual candidates | Treating search result metadata as licence proof | Verify licence on the original item page |
| jsPsych | JUSTIFIED CUSTOMIZATION ONLY | A needed behavioural task does not already exist in PsyToolkit/source materials and browser customization adds clear value | Routine demos, or when data governance/device testing is not justified | No identifying data; device test; manual fallback; explicit rationale |
| lab.js | SECONDARY CUSTOMIZATION | A low-code custom experiment is justified and PsyToolkit is insufficient | It duplicates a ready task or adds maintenance without instructional gain | Same governance/device/fallback requirements as jsPsych |
| Mr. Friess Classroom Engine stable-core | SUPPORT / QA ONLY | Non-secure package experiments, rendering/QA proof, source-inventory validation | Replacing the v5 Operating Semester Plan, Student Guide authority, secure assessments, or source-backed content bank workflow | v5 classroom package remains local/canonical; GitHub outputs are support artifacts |
| H5P | DEFER | School/district already provides frictionless hosting and one interaction solves a real lesson problem | Self-hosting creates a second LMS/maintenance stack | Pilot one item only; accessibility/device test |
| Quarto / Pandoc | DEFER | Repetitive six-unit publishing maintenance becomes a demonstrated pain point | Adopting a publishing stack for its own sake | Existing editable DOCX/PDF workflow remains primary |
| PsychoPy | DEFER | Future advanced research elective or specialist lab need | Normal high-school course delivery | Revisit only with a concrete research-grade need |

## Decision sequence

Before adopting a new tool, answer:

1. What named lesson or maintenance problem does it solve?
2. Is an existing source/tool already sufficient?
3. Does it add student login, device, installation, privacy, accessibility, or maintenance friction?
4. What is the no-tool fallback?
5. What data, if any, leave the classroom/device?
6. Will this still be easy to run when the teacher is tired, absent, or the internet fails?

If the answer to #1 is vague, do not adopt the tool.