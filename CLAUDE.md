# MockuRATOR — project rules

MockuRATOR is a free, single-file browser tool with two identities sharing one engine:
the annotator (slice screenshots, mark, note, attach MockuLog telemetry, export an
AI-executable package) and **MockuFRAME** (Wireframe Mode: 16 sketch widgets, grid+snap,
alignment, device preview, spec-flavoured reports). Live at
https://pierrehunt.github.io/MockuRATOR/ · Read ARCHITECTURE.md before editing —
it holds the module map, data model, and the traps.

## Deployment

- Pushes to `main` deploy the live site via GitHub Pages within about a minute.
- There is no build step. The deliverable is `index.html` itself.

## Versioning — required on every change

- `index.html` contains `const APP_VERSION='x.y.z', APP_BUILD='YYYY-MM-DD';` near the
  top of the script. **Always bump it before pushing**: patch (x.y.Z) for fixes,
  minor (x.Y.0) for features. Update `APP_BUILD` to today's date.
- Add a matching entry to the **Changelog** section in `README.md`.
- The version badge, console line, PNG export stamp, and saved-JSON provenance all
  read from `APP_VERSION` automatically — never hardcode a version anywhere else.

## Hard constraints

- `index.html` must stay fully self-contained: no external scripts, stylesheets,
  fonts, or build tooling. The app must work when opened from disk (`file://`).
- All browser-storage access must stay wrapped in try/catch and degrade gracefully
  (the app must still work where localStorage is unavailable).
- Saved-JSON format: keep backwards compatibility. `applyState` must continue to
  accept `app:'mockurator'` and legacy `app:'sliceboard'` files.
- The brand images (`mockurator-logo.png`, `mockurator-icon-1024.png`,
  `mockurator-favicon-512.png`) live at the repo root and are referenced by the
  README and social tags — do not move or rename them without updating references.

## Testing

- Open `index.html` in a browser: paste an image, slice (S), move (V), annotate,
  Export PNG, Export Package (unzip it — expect board.png, report.md, board.json),
  Save/Load JSON. Check the console shows the new version line.
- Keyboard shortcuts and the side-panel flip/resize behavior must keep working.

## Git conventions

- Commit messages: short imperative summary, e.g. "v1.5.1: fix export stamp size".
- Never force-push to `main`.

## Verification — required on every change

- Run `node tests/run.js` (13 jsdom suites + syntax smoke). ALL SUITES GREEN or it doesn't ship.
- Never hardcode versions in tests — suites read APP_VERSION from source.
- Edit by section banner (see index.html), verify anchor counts before any string replacement.
- The tape defines done: claims are proven by tests or MockuLog captures, never asserted.

## The satellites

- `mockulog.js` v1.1.0 — drop-in recorder, stamps every log it saves.
- `MockuRATOR-Companion.zip` — Chrome extension: full-page snap, element grab, log inject.
- `VAN-AGTERKANT-VOOR.md` — the MockuFRAME brief + shipped-status ledger.
- Working agreements: "thoughts first" = discuss only; one named zip per release;
  README changelog newest-first. Built by Pierre Hunt × Claude.
