# OWL QA legacy save fixtures

These are small, hand-authored `saveVersion: 1` payloads used by the Playwright
persistence gate. They intentionally represent older, incomplete saves rather
than current exported saves, so migration and rebuildable-state handling are
tested without committing a player's large live career archive.

- `legacy-v1-2019-season.json`: 2019 first-season progress at 7 / 28.
- `legacy-v1-2023-preplayoff.json`: 2023 regular season complete, awards viewed,
  playoff state not initialized.

The fixtures are test inputs, not production save files. Keep their scenario
meaning stable when changing their contents; update the persistence assertions
if the compatibility contract changes.
