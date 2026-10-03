# Resumable first vertical slice — 2026-10-03

The first local slice is working. This checkpoint is intentionally before the larger competition package so the captain/parent can review and continue immediately.

## Evidence measured on this machine

| Check | Result |
|---|---|
| Event/privacy unit tests | 10/10 passed |
| Browser end-to-end | 6/6 checks, no page errors; 390/768/1440 px without overflow |
| Native Electron end-to-end | 8/8 passed, virtual camera only |
| CV observation count | 144; 8 scenes × 18 repeated correlated frames |
| Warm CPU inference p50 / p95 | 96.37 / 113.87 ms, excludes first cold frame |
| Cold inference / initialization | 200.08 / 3928.36 ms |
| Peak worker RSS | 476.7 MB; includes Python/models, not Electron |
| Hardware | Windows 11 build 26200, AMD64 Family 25 Model 68, 12 logical CPUs, 15.3 GiB RAM |
| Phone photograph outcomes | TP 1/3 positives, FP 0/1 negative; not general accuracy |
| Face smoke observations | One face detected; two-face enlarged portrait collage detected; original small-face collage failed before fixture adjustment |
| Quality gating | Dark/blur flagged unusable; absence not generated on those rule-test inputs |

Native checks: capability states, consent checkbox, real CV+calibration from Y4M, Ctrl+C native guard, camera cleanup, atomic storage/recovery, deliberately killed **own** CV worker safely pauses without absence accusation then reconnects, and native emergency exit. No real camera, audio, global hooks, security settings or lock mode used.

Initial Electron test caused the user's crash dialog: exact test process exit `0xC0000005` before app window. No recent matching Application log entry was available. Isolated permitted launch with local userData and disabled hardware acceleration succeeded; exact faulting module remains unknown. Crash dialogs were suppressed only for the isolated test process via inherited process error mode, not a global Windows setting. Do not diagnose defective RAM.

## Files for parent deck and resume

- `evidence/desktop-calibration.png`, `desktop-exam.png`: actual native app with real model on public-domain fixture; no human camera session.
- `evidence/01-overview.png`, `02-consent.png`, `03-review.png`, `04-capabilities.png`, `mobile-390.png`: actual browser pixels.
- `evidence/cv-metrics.json`, `desktop-audit.json`, `ui-audit.json`, `example-report.json`: raw supporting evidence.
- `docs/ARCHITECTURE.md`: requirement/capability matrix and diagram.
- `docs/THREAT_MODEL.md`: fixes and limitations.
- `docs/DEMO_AND_DEFENSE.md`: 3-minute pitch timing and Q&A.
- `web/fixtures/replay.json`: actual detector outputs, hashes and source attribution. Repeated still images are clearly labelled.
- Browser walkthrough video: largest `evidence/page@*.webm` (~706 kB); original generated file name retained locally.

## Remaining work before competition release

1. Phone back view is predicted as **remote**, .757, rather than phone in the nano model. Compare a free larger model/alternative and test hard negatives; do not simply report a remote as confirmed phone. Tiny occluded phone also missed. Need raised/aimed-position event video and independent annotations.
2. Head/eye proxy sign conventions, glasses, occlusion, real down/side sequences, physical camera permission denial and actual CPU dropped-frame/age need validation. No event precision/recall or benign real-video false-event rate yet. Rule tests alone are not CV validation.
3. Add appropriate hysteresis, evidence provenance, explicit persisted consent, protected examiner role and better one-current-session overwrite UX. Calibration now resets on stopping the sensor.
4. Test true network-denied offline run, clean-machine setup, corrupt/missing models and persistence failure. Python lockfile is frozen from this environment; portable wheelhouse and unsigned installer not yet built.
5. Publish a new public source repository and run CI there. Connected GitHub login verified as `seoshiro`; current callable GitHub tools lack a create-repository action, and `gh` is not installed. No auth tokens were read or minted. Local git repo exists, not remote publication.
6. Publish a free static replay demo from `dist/` after `node scripts/build-demo.mjs` and Python `scripts/redact-demo.py`. This redacts detected face regions in public display while retaining provenance from originals. Site registration/deployment not started; no paid services.
7. Final presentation handled by parent. No submission, registration or organizer contact performed.

## Resume execution

Working path: `C:\Users\gokusen\Documents\Codex\2026-10-03\task\ayqyn`.

Current CV interpreter is `..\.venv\Scripts\python.exe`; dependencies/models installed. Node/pnpm are task runtime binaries; pnpm CLI path: `C:\Users\gokusen\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs`. Use Node to invoke it. Source setup creates `.venv` inside repository on a fresh machine. Electron installed at `node_modules/.pnpm/electron@44.5.1/node_modules/electron/dist/electron.exe`.

Preview server: `node scripts/serve.mjs`, `http://127.0.0.1:4173`. Do not auto-start a physical camera. Native audit is `node scripts/audit-desktop.mjs` with isolated execution permissions; it always sets fake-device/file capture and local data paths, and does not opt into fullscreen.
