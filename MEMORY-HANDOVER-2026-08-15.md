# MockuRATOR — Memory handover
**Date:** 2026-08-15 · **Supersedes:** MEMORY-HANDOVER-2026-08-14.md
**State: v1.28.0 — Pierre declared the project ~95% done; this session finished the last 5%.**

## Current architecture (major shift from v1.26)
- **NO side rails.** All panels float: Notes (blue #185f a5), Items (amber #ba7517), Selected (teal #0f6e56), Capture (purple #534ab7, annotate-only), Widgets (green #3b6d11, wireframe-only), Rails (coral #993c1d).
- Panels: draggable by coloured handle, resizable by corner grip (220–640px), magnetic snap (12px) to each other + viewport edges, closeable, reopened via coloured launcher pills in header. **Clean start**: positions/sizes reset every load (per-session only). Panels button (☰) toggles all.
- **Startup chooser** (#startModal): fresh empty load asks MockuRATOR vs MockuFRAME; remember-choice → localStorage 'mockurator:startMode' skips it forever; Esc = annotate default.
- **Right-click context menus** (buildCtxItems): per-target actions on widgets/frames/marks/pieces/images + empty-canvas actions per mode.
- **Mode tabs in header** are the brand: MockuRATOR | MockuFRAME pill.

## THE ESCAPE LAW (broke 5 times before lockdown)
ONE capture-phase document listener marked `THE SINGLE ESCAPE AUTHORITY` — 10-rung ladder:
textEntry → ctxMenu → startModal → toolModal → conscienceModal → devPreview → helpOverlay → blur-field → release-chip → cancel-drag → deselect-image → clear-msel → clear-sel.
NEVER add another Escape handler — add a rung. esctest.js counts handlers in source (max 4: authority + 2 delegations + bookmarklet string) and fails the tape on violation.
Root cause was `if(inField)return` before Esc handling while openEditor auto-focuses selCap.

## Other v1.27–1.28 features
- Toolbar: SVG alignment icons (6 align + 2 distribute) + bring-front/send-back (reorderSel), armed state teal. Header compacted (short labels).
- Snap: toggleable (Ctrl+G / checkbox in Widgets panel / right-click). Grid dots teal when on, grey when off.
- Images: click to select (ring + working corner grips), drag to move (slices follow), corner-resize (Shift = proportional, slices scale), Del deletes, Esc deselects. Del honours all selection kinds.
- Conscience modal on Export Package when rails have findings (Fix first / Export anyway).
- Rails verified working; refresh on panel open + via refreshPieces.

## Tests: 18 suites — node tests/run.js
esctest.js is the Escape contract (23 assertions). Suites are version-aware. mockulog.js fetched from raw.githubusercontent for logtest; NEVER in the zip.

## Deployment
Pierre extracts zip into Documents\GitHub\MockuRATOR, commits via GitHub Desktop, pushes. ~40 deployments to date. GitHub About/topics fix suggested (manual, on github.com).

## Open threads
1. SVG component satellite packs (Balsamiq-grade widget art) — future Claude SVG project.
2. Chrome Web Store submission for Companion (kit ready, \$5, Pierre's call).
