# Architecture — for the next builder (human or AI)

One sovereign file, satellites around it. `index.html` (~140KB, zero deps, works from file://)
contains everything; `mockulog.js`, `MockuRATOR-Companion.zip`, logos, and docs orbit it.

## The map (section banners inside index.html)
VERSION → WIDGET SKETCH DIALECT (skRect/skLine/skText/drawWidget, scale helper `lwv`) →
ANNO RENDERING (drawAnno dispatches; drawCaption wraps pills via capLayout) →
HIT TESTING (topmost-first) → SAVE/LOAD (serialize; backwards-compatible JSON) →
REPORT (buildReport: Context → Issues → Screens & components → Marks → Pieces) →
EXPORT PIPELINE (renderBoard: fixed light background regardless of theme).

## Data model
`annos[]` typed: box{x,y,w,h} · arrow{x1,y1,x2,y2} · pen{pts} · text{x,y,text,size} ·
widget{kind,x,y,w,h,label}. Shared optional fields: `c` colour, `cap` note, `g` group id,
`itype`/`sev` triage tags, `by:'ai'` marks AI replies (rendered with an AI chip; loader
accepts them natively — that's the reply-back convention). `groups[]`: {id,cap,c,itype,sev}.
`slices[]` are cut sections; `images[]` the screenshots; `contextLog[]` provenance.
localStorage keys are all `mockurator:*` (theme, layout, wfmode, boards). Drawer = seatbelt;
Save-JSON = vault.

## Traps (learned the hard way)
- `lw()` is render-scoped; widget code uses global `lwv()`. Don't confuse them.
- TWO bbox functions include widgets (content bounds for Fit; groupBBox for caps) — the line
  `if(a.t==='box'||a.t==='widget')acc(...)` exists in BOTH; anchor edits must disambiguate.
- Edit by section banner, never by long fragile string. Verify anchor counts BEFORE slicing.
- Themes touch chrome only; the canvas mat (`--stage`) stays light so ink marks stay visible;
  exports are theme-immune on purpose.

## Verification law
`node tests/run.js` (or `npm i && npm test`) — syntax smoke, then 13 jsdom suites.
Suites read APP_VERSION from source; never hardcode versions in tests.
The tape defines done: no claim ships unverified.
