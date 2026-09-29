---
target: the form builder
total_score: 17
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 5
target_identity: "file:/home/preet/projects/formforge/apps/web/app/dashboard/forms/[id]/builder/page.tsx"
target_fingerprint: "sha256:caa95b778a8b41c0e3f607dc77f2e92543a3be34c5dec92fdd031df2819bfb2e"
target_path: /home/preet/projects/formforge/apps/web/app/dashboard/forms/[id]/builder/page.tsx
timestamp: 2026-09-28T17-56-07Z
slug: apps-web-app-dashboard-forms-id-builder-page-tsx
---
Method: dual-agent (A: design review · B: detector + browser), plus a separate technical audit and a Vercel Web Interface Guidelines pass.

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 2 | "Form not found in scene." for up to 2 s while loading (page.tsx:371-388); no Draft/Live status; publish success is a toast with no link |
| 2 | Match system / real world | 1 | Scene, Asset, Project Hierarchy, PLAY, Console LIVE, TXT/MSEL/CHK codes, UUID in inspector header |
| 3 | User control and freedom | 2 | Esc doesn't close Publish modal; no undo; preview thank-you dead end |
| 4 | Consistency and standards | 2 | Palette "Single Select" creates "Single Choice" (page.tsx:53-66 vs FieldCard.tsx:21-30); deletes bypass Save |
| 5 | Error prevention | 2 | Can publish 0 fields / "Untitled Form"; double-click publishes twice |
| 6 | Recognition rather than recall | 2 | Title/theme/share link unreachable from builder; must remember to Save before PLAY/PUBLISH |
| 7 | Flexibility and efficiency | 1 | No Cmd+S, no / menu, no duplicate, no keyboard reorder |
| 8 | Aesthetic and minimalist design | 2 | 5 panels, same field list shown twice, console duplicates toasts |
| 9 | Error recovery | 1 | Raw err.message; [ERROR] screen with no retry or way back |
| 10 | Help and documentation | 2 | Good empty-canvas hint; no info affordances |
| **Total** | | **17/40** | **Poor** |

## Design Specificity Verdict
Authored, but for the wrong product: VS Code Dark+ palette in a Unity panel layout. Coherent, but borrowed from dev tools rather than grounded in forms or respondents. Game-engine vocabulary remains throughout despite the decision to remove it. The canvas is not the form: no themed rendering, and the preview drops the theme (theme prop passed to FormRenderer but unused; no data-theme wrapper).
Detector: 2 CLI findings in builder scope (side-tab FieldCard.tsx:91; layout-transition ConsolePanel.tsx:51), both confirmed; browser overlay 125 flags over 4 views, mostly 9-10px text below the 11px floor and 3.2-3.8:1 contrast. The body-level layout-transition flag is a false positive from Sonner's CSS. The detector missed every P0/P1 issue below.

## Priority Issues
- [P0] Publish modal off-centre (framer-motion scale overwrites translate(-50%,-50%), PublishModal.tsx:43-59); the confirm button is off-screen below ~800px width / ~610px height. Also no dialog semantics, focus trap or Esc, and no pending state. Command: /impeccable harden
- [P1] Publishing is a dead end: toast only, no URL/copy/open/QR, no Live status in the builder (page.tsx:143-153). Command: /impeccable onboard, /impeccable clarify
- [P1] False "Form not found in scene." during the 2 s loading window (page.tsx:371-388), against the AGENTS.md four-state order. Command: /impeccable harden
- [P1] Preview isn't what respondents see: no theme, gated behind Save though it renders local fields (page.tsx:340-348, 391-430). Command: /impeccable layout
- [P1] Game-engine shell: 5 panels, duplicated lists, IDE jargon, a misleading "LIVE" console. Command: /impeccable distill, /impeccable clarify
- [P1] Keyboard/screen reader: drag-only reorder while the handles announce keyboard pickup that does nothing; drag shows no feedback (motion.div overwrites the dnd-kit transform); unlabelled inspector controls; no reduced-motion support anywhere. Command: /impeccable harden, /impeccable animate

## Persona Red Flags
- Jordan: can't name the form in the builder; grip icons imply drag; PLAY is save-gated; no link after publishing.
- Sam: ~30 tab stops incl. 6 silent drag handles; canvas cards unfocusable; unnamed inputs/switch; modal not a dialog.
- Alex: no shortcuts, / menu, duplicate or type change; no controls for minLength/maxSelections/date limits the validator supports.
- Cold evaluator: false not-found on a cold start; at 390px the canvas is 0px wide; fandom demo content reads as hackathon.
- Creator checking the respondent side: the theme is invisible until the form is published.

## Bugs found along the way (live respondent side)
- Enter on the thank-you screen re-submits (FormRenderer.tsx:172-184): duplicate responses after the 30 s dedup window.
- "Submit another response" leaves the button stuck on "Submitting..." (formStore.ts:39 reset; FormRenderer.tsx:113-121).
- Edits typed during an in-flight save are lost (page.tsx:241-284).
- Mono font never loads: 161 'JetBrains Mono' literals vs a loaded Geist Mono under the name jetbrainsMono.

## Questions to Consider
1. If the canvas showed each question as the respondent sees it, would PLAY, the Hierarchy or half the inspector still be needed?
2. Why a Save button? Autosaved drafts plus a publish snapshot remove most of the gates.
3. What if publishing were the climax: live URL, QR, "Open your form"?
4. Blank "Untitled Form", or starter templates that publish immediately?
