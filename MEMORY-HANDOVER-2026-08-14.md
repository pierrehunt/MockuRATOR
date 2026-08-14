# MockuRATOR — Memory handover for next Claude session
**Date:** 2026-08-14 · **Supersedes:** MEMORY-HANDOVER-2026-08-13.md

## Product
Browser-based screenshot annotation + wireframe tool. Single HTML file, MIT, GitHub Pages.
`pierrehunt.github.io/MockuRATOR` — author: Pierre Hunt (pierrehunt on GitHub).
Pierre's safeword for the wireframing direction: **"van agterkant voor"** (Afrikaans: from the back to the front).

## Current state: v1.25.0 (APP_BUILD 2026-08-14)
**17 test suites, all green.** The suite battery runs with `node tests/run.js` from the repo root.

### What shipped in v1.25.0 (four threads)
1. **Device Frames** — `t:'frame'` annos (phone 390×844, tablet 768×1024, desktop 1280×800).
   - Placed from screen chips in #framechips (📱📲🖥️), each gets `.wchip` class (total 16 widget + 3 frame = 19 wchips).
   - Sketch dialect: drawFrame draws speaker/home bar/browser chrome depending on device.
   - hitFrame: border + name strip only — interior stays free for widget editing.
   - frameTitleRect: 30px strip 6px above frame top edge.
   - Containment: `frameOf(a)` = geometric (annoCenter → frameAtPoint); never stored.
   - moveFrame: rigid delta, carries frameMembers (widgets/slices) + glued flow-arrow endpoints.
   - dblclick on name strip → openText(e,p,frameIdx) → renames frame.label.
   - Report: per-frame `### 📱 Login — phone · 390×844` sections, relative coords, Backstage catch-all.

2. **Template packs** — droppable `{app:'mockurator-template',v:1,name,items:[]}` JSON format.
   - `insertTemplate(t)` inserts at `freeSpot()`, boardSnap for undo, frames pushed first.
   - Five built-in packs: Auth ×3, SaaS shell, Shop ×4, Landing, Pricing — buttons in secWidgets.
   - Drop route: `loadJSONFile` detects `d.app==='mockurator-template'` → insertTemplate (not applyState).

3. **Guide-rail engine** — five RAILS: primary (>1 button/screen), target (<36px), contrast (WCAG on white), label (unlabeled), note (no behaviour note).
   - `railFindings()` → string array; `refreshRails()` → panel; `railState` persisted to localStorage.
   - Report: `**UX notes for the builder (guide rails):**` block from railFindings(); omitted when master off.
   - `refreshRails()` called at end of `refreshPieces()` via guard.

4. **Reply-back v2** — stable ids + thread connectors.
   - `ensureIds()` stamps `id:'mN'` on every anno at serialize/buildReport time; `nextMid` re-seeded on applyState.
   - `drawAIThreads(g)`: dashed connector from AI mark with `re:'<id>'` to target; dot at target.
   - Report: mark lines carry ` · id: m3` suffix (after caption, outside geo parens); `↳ replying to m42` sub-line.
   - AI_PROMPTS.pkg updated to explain the id/re reply convention.
   - Duplicate drops `delete c.id` so clones don't share ids with originals.

### 4 new test suites
- frametest.js — chip/place/hitFrame/moveFrame+contents/rename/report per-screen+flows+backstage
- tmpltest.js — built-in buttons/insertTemplate/boardSnap-undo/drop-route
- railtest.js — contrast math/primary-per-frame/toggles/master-off/report conscience
- replytest.js — ensureIds/nextMid/report id+re threads/pkg prompt/dup drops id

## Known packaging note
`mockulog.js` is NOT in the release zip — it would overwrite Pierre's real one on extract.
logtest.js fetches it from `raw.githubusercontent.com` at test time. Keep excluded from packaging.

## Known latent quirk
`lwv` (export-zoom helper) in `renderBoard`: export canvas has no zoom, so effectively `v/1`.
If renderBoard ever gains a zoom parameter, lwv must be rebound in that scope. Low risk for now.

## Index.html section order (section banners)
VERSION → DEVICE FRAMES (screens) → WIDGET SKETCH DIALECT → ANNO RENDERING →
HIT TESTING → pieces list → content bounds → tools → pointer handling →
unified selection + editor → text tool → edit ops → help overlay → keyboard →
image input → capture → save/load → SAVE/LOAD → EXPORT PIPELINE → report + package →
GUIDE RAILS → REPORT → ZIP writer → package button → bookmarklet → toast →
voice dictation → device preview → alignment → wireframe mode → widget palette →
presets → template packs → colour themes → tool info modal → AI hand-off prompts →
tips → init

## Invariants to preserve
- Frames never in groups/marquee/msel — excluded naturally by hitAnno skip + selectMark type check.
- Containment always geometric (frameOf), never stored on the anno.
- Frame ✕ in Items deletes only the frame; contents stay.
- One zip per release, single properly-named file (MockuRATOR-vX.Y.Z.zip).
- Report/prompt edits must keep prompttest + widgtest + unitest regexes passing.
- "Thoughts first" = discuss; "Build" = build immediately. Pierre corrects when mixing these up.

## Deployment workflow
Pierre uses GitHub Desktop. After receiving the zip:
1. Extract into `Documents\GitHub\MockuRATOR` (overwrites index.html + all docs/tests).
2. Commit with version message: `v1.25.0 — Device frames, template packs, guide rails, reply-back v2`.
3. Push via GitHub Desktop. Never force-push.

## Open threads (prioritised)
1. **SVG component palette / satellite packs** — the "van agterkant voor" horizon; Balsamiq is the reference. MockuRATOR is ~70% there; the SVG component pack is the key remaining piece. Pierre flagged this as a future Claude SVG project.
2. **Chrome Web Store submission** for the Companion extension — kit is written (STORE_SUBMISSION.md), $5 fee, whenever Pierre decides.
