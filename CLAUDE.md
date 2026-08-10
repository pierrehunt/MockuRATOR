# MockuRATOR — project rules

MockuRATOR is a free, single-file browser tool for slicing screenshots into movable
pieces, annotating them, and exporting a PNG. Live at https://pierrehunt.github.io/MockuRATOR/

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
