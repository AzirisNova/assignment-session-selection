# Session Selection

Session-selection feature for a fictional client booking website (JavaScript / Node.js, no UI or database).

## Requirements
- Node.js 20 or later (tested on v22). No npm packages needed.

## Open in PhpStorm
1. **File → Open…** and choose this `session-selection` folder.
2. Make sure a Node interpreter is set: **Settings → Languages & Frameworks → Node.js**.
3. Pick **Run tests (node --test)** from the run dropdown (top right) and press ▶.

## Run from a terminal
```
node --test
```
or `npm test`.

## Files
| File | Purpose |
|------|---------|
| `sessions.mjs` | Dataset, `selectSessions`, `createSessionIndex` |
| `sessions.test.mjs` | 12 automated tests (Node test runner + strict assertions) |
| `test-results.txt` | Recorded test output |
| `EVIDENCE.md` | Scenario table, race-condition analysis, design decisions |
