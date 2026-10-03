# AYQYN resumable audited checkpoint — 2026-10-03
The local prototype and static review demo are implemented. This is a second checkpoint for independent review, **not a competition release**. Native packaging is blocked by verified Windows application control; see `WINDOWS_RUNTIME_BLOCK.md`.

## Current measured evidence
| Scope | Result |
|---|---|
| Node rule/schema/camera lifecycle/storage regressions | 20/20 passed; `evidence/core-audit.txt` |
| Browser E2E | 7 checks passed; consent defaults, replay, review/reload, image-free export, mobile drafts/export, responsive widths, confirmed deletion |
| Native Electron E2E | 10 checks passed on file-backed virtual camera; no physical camera or fullscreen activated |
| Independent photo selection | 32 Open Images validation scenes selected by sorted IDs before inference; original license/author/boxes/hash in manifest |
| YOLO11n 640, conf .45 | 9/10 manually verified physical-phone photographs detected; 12/16 dataset-labelled positives localized (IoU ≥.3); 3/16 negative scenes falsely detected |
| YOLO11n 960, conf .45 | 7/10 verified physical photos; 10/16 dataset positives localized; 3/16 negative scenes falsely detected; rejected |
| YOLO11s 640 comparison on reused set | 9/10 verified physical photos; 13/16 dataset positives localized; 3/16 negative scenes falsely detected; no demonstrated overall improvement |
| Detector decision | Keep YOLO11n 640/.45. Do not tune threshold or re-label remotes as phones to improve this set |
| Portable/clean-machine installation | NOT passed: PyInstaller packaging stopped after unsigned Polars/Contourpy Code Integrity failures |
| Public repository / CI / deployment | Not published in this checkpoint |

Photo scene-level detection is not mAP, exam-video precision/recall, phone-raising trajectory accuracy or a benign false-event rate. Four dataset positives are product graphics and two ambiguous device examples; ten are manually verified physical-phone photographs. Manual visual review was by Codex, not an independent human. YOLO11s used the already-inspected set as a development comparison; a new held-out set is required before any model change. Its timing was measured while dependency packaging analysis also ran, so no controlled speedup/slowdown claim is made.

Pipeline diagnostics checked class map (`cell phone` = 67), class-filter parity, NMS/default IoU, native aspect-preserving letterbox, confidence diagnostics and 640/960 sizes. The desktop renderer's aspect-ratio stretch was fixed. There is no exported model in the current pipeline; export parity is therefore not claimed. Native screenshots and JSON show real inference on licensed fixtures, with conspicuous virtual-source labels.

## Independent audit fixes
Read `AUDIT_FIXES.md` for each finding and disposition. Key fixes: asynchronous capture cancellation, consent revocation, frame/readiness watchdogs, main-process freshness gate, strict bounded session/report schema, owned temp cleanup, pitch/iris calibration stability, continuous event episodes, preserved consent/calibration segments, separate snapshot consent, source labels, reviewer draft retention, replacement export/deletion confirmations, darker secondary text and distinct capture-age measurement.

Actual screenshots:
- `evidence/desktop-calibration.png`, `desktop-exam.png`, `desktop-worker-interruption.png`.
- `evidence/03-review.png`, `mobile-review-reason.png`, `04-capabilities.png`.
- Original browser walkthrough was an automated short test recording, not a judge-ready demo. It is not included as a final demo video.

## Runtime security notice
The installed Polars binary is unsigned and Windows Code Integrity denied loading it during packaging analysis. Exact package/hash and redacted event evidence are documented. Build stopped; no protection was disabled and no alternate execution of the denied binary attempted. A separate Contourpy plotting module was also denied. Do not restart broad Python dependency scanning or native packaging until an inference-only dependency graph omits these modules, or a supported minimal runtime has been chosen. No malware/false-positive assertion or RAM diagnosis.

## Remaining case gaps
1. Actual consented, annotated moving phone/head/eye clips, phone aimed toward screen, glasses/occlusion and benign movements. Current repeated stills and transformed composites are explicitly labelled; real video quality is not established.
2. An inference runtime compatible with current Windows policy, offline asset verification, clean installation and actual packaged release. Prefer eliminating unused training/tabular/plotting dependencies; investigate reproducible official YOLO ONNX + minimal inference only with output parity.
3. Native active-exam revocation, no-decoded-frame/frozen-track cases, camera denied/loading screenshots, repeated cold starts, sustained resource measurements and storage permission/disk-failure E2E.
4. Separate snapshot-checkbox E2E, complete keyboard/screen-reader/contrast audit and trustworthy examiner authentication. One-current-session only; explicit replacement export/deletion confirmation exists, archive/undo does not.
5. True network-denied offline test, package attribution/license inventory, signed integrity provenance if institution needs it. Local administrator can still tamper with files. No real institutional exam claim.
6. New public repository/free redacted static demo, exact remote commits/CI/deployment verification. Connected GitHub user was verified earlier, but available API tools do not create repositories and no shell-auth credential was obtained. Parent can resolve this tooling without reusing earlier repos.
7. Parent pitch/PDF package after these gaps are accurately scoped.

## Resume
Source directory is `ayqyn/` in the delegated workspace. Current CV venv is adjacent at `../.venv/Scripts/python.exe`; normal setup creates `.venv` inside the project. Node and pnpm dependencies are installed. Static preview: `node scripts/serve.mjs` on 127.0.0.1:4173.

Do not run `pnpm package` as a working release: the old simple packaging command excludes Python and the new bundled-worker path is not yet populated. The aborted PyInstaller work is under ignored `data/pyinstaller`; no usable release directory exists. The test virtual video is ignored `evidence/virtual-camera.y4m` and contains a repeated public-domain NASA photograph, not participant capture.

No native audit/build is intentionally running at checkpoint. The original static HTTP server may still be running (local port 4173). No camera, microphone, global keyboard hook, OS lock or organizer communication was activated.

