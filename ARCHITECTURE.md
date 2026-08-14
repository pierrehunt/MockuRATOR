# Architecture — for the next builder (human or AI)

One sovereign file, satellites around it. `index.html` (~150KB, zero deps, works from file://)
contains everything; `mockulog.js`, `MockuRATOR-Companion.zip`, logos, and docs orbit it.

## The map (section banners inside index.html)
VERSION → DEVICE FRAMES (FRAMES const, drawFrame sketch dialect, hitFrame border+strip,
frameTitleRect, annoCenter, frameAtPoint, frameOf, frameMembers, mkFrameDrag, drawAIThreads) →
WIDGET SKETCH DIALECT (skRect/skLine/skText/drawWidget, scale helper `lwv`) →
ANNO RENDERING (drawAnno dispatches frames first, then rest; drawCaption wraps pills via
capLayout; drawGroupCaps; drawAIThreads draws dashed re: threads after group caps) →
HIT TESTING (hitAnno skips frames; hitFrame border+name-strip only, interior free) →
SAVE/LOAD (ensureIds stamps stable ids; serialize; nextMid re-seeded on applyState; template
route in loadJSONFile: app:'mockurator-template' → insertTemplate, not applyState) →
GUIDE RAILS (RAILS array, relLum/contrastOnWhite, railFindings, refreshRails) →
REPORT (buildReport: Context → Issues → Screens & components per-frame + Backstage + UX
conscience from railFindings → User flows cross-screen arrows → Marks with id+re threads →
Pieces → Attached logs) →
EXPORT PIPELINE (renderBoard: frames-first two-pass; drawAIThreads; fixed light background).

## Data model
`annos[]` typed: box{x,y,w,h} · arrow{x1,y1,x2,y2} · pen{pts} · text{x,y,text,size} ·
widget{kind,x,y,w,h,label} · **frame{device,label,cap,x,y,w,h}** — new in 1.25.0.
Shared optional fields: `c` colour, `cap` note, `g` group id, `itype`/`sev` triage tags,
`by:'ai'` marks AI replies, **`id` stable mark id (e.g. "m3")**, **`re` reply target id**.
Ids are assigned by `ensureIds()` at serialize time and re-seeded via `nextMid` on load.
Frame containment is **geometric, never stored** — `frameOf(a)` derives it at call time
via `annoCenter(a)` + `frameAtPoint(x,y)`. Frames never join groups or msel.
`groups[]`: {id,cap,c,itype,sev}. `slices[]` sliced sections; `images[]` screenshots;
`contextLog[]` provenance; `attachments[]` log files.
localStorage keys: `mockurator:*` (theme, layout, wfmode, boards, rails). Drawer = seatbelt;
Save-JSON = vault.

## Template JSON format
```json
{ "app": "mockurator-template", "v": 1, "name": "My pack", "items": [
    { "t": "frame", "device": "phone", "x": 0, "y": 0, "w": 390, "h": 844, "label": "Login" },
    { "t": "widget", "kind": "button", "x": 100, "y": 400, "w": 140, "h": 44, "label": "Log in" },
    { "t": "arrow", "x1": 195, "y1": 844, "x2": 695, "y2": 422, "c": "#2563eb", "lw": 3 }
] }
```
Dropping such a file inserts the pack at a free spot; board is NOT replaced. All coordinates
are relative to (0,0); `insertTemplate` offsets by `freeSpot()`. Frames always pushed first
so containment detection works for the widgets that follow.

## Guide rails
Five toggleable RAILS check for UX smells on every `refreshPieces()` call:
primary (>1 button per screen), target (<36px interactive), contrast (WCAG on white export),
label (unlabeled widgets), note (no behaviour note). `railState` persisted to localStorage.
`railFindings()` returns the active findings array; `refreshRails()` renders the panel.
Report omits the conscience block entirely when master is off.

## Traps (learned the hard way)
- `lw()` is render-scoped; widget and frame code uses global `lwv()`. Don't confuse them.
- TWO bbox functions include widgets (contentBBox for Fit — also includes frames+title strip;
  groupBBox for caps — does NOT). The line `if(a.t==='box'||a.t==='widget')acc(...)` exists
  in BOTH; frame was added only to contentBBox. Anchor edits must disambiguate.
- `render()` now does TWO passes: frames first, rest second. `renderBoard()` mirrors this.
  Any future two-pass rendering change must update BOTH functions.
- Frame containment is dynamic — never cache `frameOf(a)`. It changes when user moves anything.
- `mkFrameDrag` snapshots annos/slices/groups for boardSnap undo AND pre-captures `glue[]`
  (flow arrows with one endpoint inside the frame). Glued endpoints follow the frame rigidly
  on move. Do not simplify: the snapshot must happen before any coordinate mutation.
- `hitAnno` skips frames (`if(a.t==='frame')continue`) so clicks inside a frame reach widgets.
  If this is ever removed, every interior widget click will hit the frame instead.
- Template `insertTemplate` pushes frames first (so frameOf can detect containment for the
  widgets that follow in the same call). Do not reorder.
- `ensureIds()` must be called at the TOP of `buildReport()` and `serialize()` — not at the
  bottom. Ids must exist before any loop reads them.
- `idTag` in mark lines lives AFTER the closing `)` as ` · id: m3`. The unitest regex expects
  `~w×h @ (x,y)): caption` as a substring — putting idTag inside the parens breaks it.
- Edit by section banner, never by long fragile string. Verify anchor counts BEFORE slicing.
- Themes touch chrome only; the canvas mat (`--stage`) stays light so ink marks stay visible;
  exports are theme-immune on purpose.
- `lwv` export-zoom latent quirk: in `renderBoard` the export canvas has no zoom so `lwv=v=>v/1`
  effectively. If export ever gains zoom, `lwv` must be re-bound. Document the assumption.
- `mockulog.js` is NOT in either release zip (it would overwrite Pierre's real one). The logtest
  fetches it from raw.githubusercontent.com. Keep it excluded from packaging.

## Verification law
`node tests/run.js` (or `npm i && npm test`) — syntax smoke, then 17 jsdom suites.
Suites read APP_VERSION from source; never hardcode versions in tests.
The tape defines done: no claim ships unverified.
