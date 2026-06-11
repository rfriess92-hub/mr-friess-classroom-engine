import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('package answer-leak QA passes clean Psychology foundations proof', () => {
  const output = execFileSync('node', ['scripts/qa-package-answer-leak.mjs', '--package', 'fixtures/psychology/foundations-package.proof.json'], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const result = JSON.parse(output).package_answer_leak_qa
  assert.equal(result.judgment, 'pass')
  assert.equal(result.blockers.length, 0)
  assert.ok(result.checked_outputs.some((entry) => entry.output_id === 'psychology_foundations_student_packet'))
})

test('package answer-leak QA allows false-valued student safety flags', () => {
  const dir = mkdtempSync(join(tmpdir(), 'package-answer-leak-qa-safe-flags-'))
  try {
    const fixturePath = join(dir, 'safe-flags-proof.json')
    writeFileSync(fixturePath, JSON.stringify({
      package_id: 'safe_flags_fixture',
      primary_architecture: 'single_period_full',
      task_sheet: {
        audience: 'student',
        answer_key: false,
        teacher_only: false,
        instructions: ['Complete the reflection and checklist.'],
      },
      outputs: [
        {
          output_id: 'safe_student_packet',
          output_type: 'task_sheet',
          artifact_family: 'task_sheet',
          audience: 'student',
          visibility: { student: true, teacher: false },
          answer_key: false,
          source_section: 'task_sheet',
        },
      ],
    }, null, 2))

    const output = execFileSync('node', ['scripts/qa-package-answer-leak.mjs', '--package', fixturePath], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const parsed = JSON.parse(output).package_answer_leak_qa
    assert.equal(parsed.judgment, 'pass')
    assert.equal(parsed.blockers.length, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('package answer-leak QA blocks teacher-only content in student output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'package-answer-leak-qa-'))
  try {
    const fixturePath = join(dir, 'bad-proof.json')
    writeFileSync(fixturePath, JSON.stringify({
      package_id: 'bad_answer_leak_fixture',
      primary_architecture: 'single_period_full',
      teacher_guide: {
        audience: 'teacher',
        answer_key: true,
        teacher_notes: ['Use the exact answer: cognitive perspective because of attention and memory.'],
        model: {
          sample: 'The correct explanation is cognitive perspective because of attention and memory.',
        },
      },
      task_sheet: {
        audience: 'student',
        answer_key: false,
        instructions: ['Use the exact answer: cognitive perspective because of attention and memory.'],
        teacher_notes: ['This should never be student visible.'],
      },
      outputs: [
        {
          output_id: 'bad_student_packet',
          output_type: 'task_sheet',
          artifact_family: 'task_sheet',
          audience: 'student',
          visibility: { student: true, teacher: false },
          answer_key: false,
          source_section: 'task_sheet',
        },
        {
          output_id: 'bad_teacher_guide',
          output_type: 'teacher_guide',
          artifact_family: 'teacher_guide',
          audience: 'teacher',
          visibility: { student: false, teacher: true },
          answer_key: true,
          source_section: 'teacher_guide',
        },
      ],
    }, null, 2))

    const result = spawnSync('node', ['scripts/qa-package-answer-leak.mjs', '--package', fixturePath], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    assert.notEqual(result.status, 0)
    const parsed = JSON.parse(result.stdout).package_answer_leak_qa
    assert.equal(parsed.judgment, 'block')
    assert.ok(parsed.blockers.includes('student_source_teacher_field_leak'))
    assert.ok(parsed.blockers.includes('student_source_teacher_value_leak'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
