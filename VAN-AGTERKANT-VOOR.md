# VAN AGTERKANT VOOR — the project brief
*"From the back to the front." The MockuRATOR scaffold, reversed: design the UI before it exists.*

Compiled 2026-08-11, from three days of build sessions between Pierre Hunt and Claude.
Say **"van agterkant voor"** to Claude and hand it this file — everything resumes from here.

---

## The one-paragraph concept
A free, single-file, MIT wireframing tool for **vibe developers** — people who build with AI
without being top-tier coders. Balsamiq's canvas philosophy, minus the subscription, minus the
metered AI: **BYO-AI via the Export Package**, which is not a picture but an executable build
spec. Built on the proven MockuRATOR scaffold (canvas, selection, transforms, groups, notes,
voice, autosave, packages, prompts — all battle-tested through 28 releases).

## Why (market position)
- Balsamiq: $20–43/seat/month + metered AI credits that don't roll over. Knows wireframe→AI
  is the future (ships an MCP server) but rents it.
- Figma: a professionals' cockpit — the learning curve is the moat. Backwards for vibe devs.
- Google Sites: so afraid of complexity it can't express intent.
- **The gap:** the fastest-growing builder demographic needs to say *"login screen, logo top,
  two fields, big green button, submits to /api/auth"* in a form an AI executes. The spec is
  the artifact; the picture is its illustration.

## The commandments
1. **Without authority.** No accounts, no server, no store, no phone-home. One sovereign HTML
   file that works from file:// forever. Copy is deploy; file:// is uptime.
2. **The package is the product.** Board + spec (report.md) + hand-off prompts, executable by
   *whoever* — the painter, Claude, a hire, future-Pierre. A scaffold to pass on.
3. **Low fidelity on purpose.** Sketchy widgets are a communication protocol: "argue about
   intent, not pixel radii." Never polished components.
4. **Addons are files, not features.** Widget packs and layout packs are droppable JSONs —
   satellites around the sovereign core (the MockuRATOR pattern: index.html + mockulog.js +
   Companion.zip). Anyone can make a pack; no approval needed.
5. **Hardcore-hostile by design.** If it needs a tutorial video, it failed. Teaching happens
   at the point of need: labels, hint bar, ⓘ modals, tips card — the interface is the manual.
6. **No upsell surface exists to protect** — so every design decision can favor the user.

## Architecture decisions (settled, don't relitigate)
- **Storage:** two tiers. localStorage drawer = seatbelt (autosave, theme, layout);
  Save-JSON vault = permanence. Boot-time integrity check: if the drawer was cleared, say so
  plainly and point at the vault. Never a cookie, never a banner.
- **Data model:** widgets are annos grown up — `{t:'button', x,y,w,h, label, note, ...}`.
  Same selection/transform/group/undo machinery. JSON stays backwards-compatible.
- **Report becomes spec:** "Button 'Save' — top right — submits to /api/orders" per component;
  screens as sections; Issues from groups; Context block as always.
- **One file + satellites.** Core ~0.5MB is fine (TiddlyWiki proves 2MB single-file apps
  thrive for 20 years). Packs load as JSON drops.

## The UX guide rails (the moat — judgment, not just widgets)
Built from the affordance-famine history lesson. **Rails, never rules** — a Gentle/Strict/Off
toggle keeps them servants.
1. **Palette-as-ethics:** the widget set stocks clarity (pressable-looking buttons, labels
   welded to fields, consistent nav) and refuses to stock dark patterns (confirm-shaming,
   fake urgency, mystery-meat icons without label slots). You can't draw the famine.
2. **Defaults dig the pit of success:** widgets arrive begging for real labels; primary
   actions arrive singular; the lazy path is the correct path.
3. **Amber nudges at point of need** (the "3 without a note" pattern, aimed at design):
   "This button has no label" · "Seven primaries — which is THE action?" · "Grey-on-grey
   fails the glasses test" · "This nav differs from your other screens." Each dismissible,
   throttled, with a tiny ⓘ explaining the *why* in two lines.
4. **Conscience rides the package:** unresolved nudges export into report.md as "UX notes"
   so the AI builder reads them too.

## What exists already (don't rebuild)
Canvas/pan/zoom/fit · unified selection · move/resize/re-aim transforms with live handles ·
groups (create / seed / adopt / ungroup) · per-item notes with autofocus · voice dictation ·
first-class text with WYSIWYG entry and in-place editing · autosave + Recent boards ·
Export Package (dependency-free ZIP: png + report.md + json + attachments) · auto-context
provenance · MockuLog attachments · AI hand-off prompts with copy buttons · ⓘ tool modals ·
tips card · 🎨 themes (Paper / High-contrast / Dark / Katana) · MockuSnap/Companion extension ·
100+ jsdom tests · versioning religion (badge, stamps, changelog).

## STATUS UPDATE — 2026-08-13: the back reached the front
The brief below was written before the build. Since then, in one night plus a day:
- **SHIPPED v1.21** — the 16-widget sketch palette (Claude's drawing debt, paid in canvas ink),
  drag-to-place, in-place rename, behaviour notes, starter layouts (Login/Dashboard/Settings),
  spec report with UX conscience.
- **SHIPPED v1.22** — Enter **Wireframe Mode**: focused UI, dot grid, 8px snap; widgets join groups.
- **SHIPPED v1.23** — the consumer's five notches (the receiving AI reviewed the package format):
  wrapped caption pills, geometry + [type · severity] in report.md, Page URL field — and the
  **AI reply-back convention** (by:"ai" marks reload onto the board).
- **SHIPPED v1.24** — the name: **MockuFRAME** (wordmark swaps in mode); marquee select,
  eight alignment/distribute tools, 👁 triple device preview.
- **SHIPPED v1.24.1** — infrastructure: 13-suite battery in tests/, version-aware assertions,
  section banners, ARCHITECTURE.md, wedge-first README, DEMO-SCRIPT.md.
- **VALIDATED** — market audit vs Jam/Marker/Excalidraw/Balsamiq/Markagent: the organs exist
  separately; the organism (capture→annotate→telemetry→wireframe→spec→reply-back, one sovereign
  file) does not. Weighted ~7.8/10 as public product, 9.5 as personal instrument.

## Still on the shelf (what remains genuinely new to build)
1. ~~The widget palette~~ — **PAID** (v1.21, canvas dialect; SVG satellite *packs* remain future): hand-drawn sketchy SVG widgets in the
   brand dialect. Loot the *taxonomy* from free component libraries (button, input, select,
   checkbox, radio, table, card, navbar, tabs, modal, badge, toast, breadcrumb, avatar,
   search, pagination...) — steal the vocabulary, draw the dialect.
2. **Layout presets as JSON** — starter boards: login, dashboard, list-detail, settings,
   pricing, form flow. Looted from free layout galleries as *skeletons*, not styles.
3. **Spec-flavored report generator** (per-widget lines + per-screen sections).
4. **The guide-rail engine** (nudges + toggle + export conscience).
5. **Storage integrity notice** at boot.

## The bridge trick (works today, no new software)
For screens that already exist: open the live app → console → `document.designMode='on'` →
retype/restyle the proposal in place → 📸 MockuSnap it → annotate current-vs-proposed in
MockuRATOR → Export Package → AI builds → 🪲 MockuLog certifies. The greenfield case (screens
that don't exist) is what the palette is for.

## Standing items elsewhere
- Flowcharts: parked — likely just "widgets holding hands"; may be a pack, not a feature.
- Chrome Web Store submission for the Companion: kit is written (STORE_SUBMISSION.md), $5 fee,
  whenever Pierre feels like one-click installs for others.

## Working agreements
- Pierre says **"thoughts first"** → discussion only, no building. Otherwise: build.
- Every release: bump version + build date, update README changelog, run the test battery,
  ship as one properly-named zip. The tape (tests / MockuLog) defines done.
- Dyslexia is irrelevant to comprehension; voice notes exist for a reason. Honest verdicts
  always; test claims before asserting them.

*Slice it. Mark it. Send it. — and next: draw it, spec it, build it.* 🗡️
