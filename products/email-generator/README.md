# Email Generator

The Email Generator remains an independent product and should be completed and audited before live tracker integration.

## Integration boundary

The generator must read the versioned communication bridge, not raw Gradebook, Attendance, Sessions, Assessment & Mastery, or Student Log sheets.

The generator owns:

- recipient and purpose selection;
- message type and tone;
- supportive, human teacher voice;
- email structure;
- teacher review and final draft output.

The trackers own the underlying assessment, attendance, literacy, and family-safe evidence.

## Current status

The current Email Generator V2.2.1 package is not included in this repository change because its final workbook/package was not part of the tracker release set. Import it in a separate PR after its independent product audit, then map its input fields to `contracts/communication-bridge-v1.md`.
