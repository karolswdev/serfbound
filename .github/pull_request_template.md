## Summary

-

## PMO Story

- Story:
- Evidence:
- If this is a small maintenance change, explain why no story status changes.

## Verification

Commands run:

```text

```

## Boundaries

- [ ] No original DOS/Amiga data, extracted sprites, music, sounds, disk images, executables, or unlicensed converted assets are staged.
- [ ] Browser/runtime boundary is unchanged or documented.
- [ ] UI-facing changes follow `docs/design/design-standard.md`, or `.tmp/DESIGN-OK.md` explains the scoped exception.
- [ ] PMO contract will run through `.githooks/pre-commit`; no `--no-verify`.

## Checklist

- [ ] Tests or docs checks cover the change.
- [ ] PMO status/evidence files are updated when a story moves to `done`.
- [ ] README, docs, or release notes are updated when user-facing behavior changes.
