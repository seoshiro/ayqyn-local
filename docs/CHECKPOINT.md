# AYQYN v0.2 audited checkpoint — 2026-10-03

Working local desktop prototype and review console. This is a resumable implementation checkpoint, not a complete competition release. New repository; provisional project/team name AYQYN.

## Verified current evidence

| Scope | Result and evidence |
|---|---|
| Rules, schemas, capture lifecycle, storage and vision math | 27/27 Node regressions; `evidence/core-audit.txt` |
| Browser review flow | 7 E2E checks: consent defaults, real-result fixture replay, reason-required review/reload, image-free export, mobile drafts/export, responsive widths and deletion |
| Native desktop flow | 10 E2E checks with explicitly labelled file-backed virtual camera, no physical camera or fullscreen activation |
| Renderer race regression | 3 actual-renderer delayed-exam-IPC checks: Stop, revoke and navigation cannot resurrect an exam |
| Current real CV | Official YOLO11n ONNX + MediaPipe WASM, six licensed original/derived still fixtures; `evidence/wasm-runtime-audit.json` |
| Runtime parity | 32/32 scene phone-presence and 32/32 localization decisions match frozen PyTorch baseline; min paired box IoU .99056, max confidence delta .0325 |
| Small photo benchmark | 9/10 verified physical-phone photos detected; 12/16 dataset-labelled positives localized at IoU ≥.3; 3/16 negatives falsely detected |
| Current processing timing | Single-thread WASM p50/p95 233.4/322.5 ms on those 32 scenes; excludes capture/IPC; initialization about .67–.69 s |
| Windows package | Unsigned `release/AYQYN-win32-x64/AYQYN.exe` starts and performs real inference; 5 packaged checks from copied folder without Python/Node in PATH |
| Fresh OS and network disconnected run | Not performed; copied-folder test is on this same machine |
| Remote repository, CI, public deployment | Not published; local git source exists |

Photo detection is not mAP, video accuracy or benign false-event rate. Selection, authors, image licenses, hashes and boxes are retained in evaluation manifests. Four positives are product graphics, two ambiguous devices; ten physical-phone photographs were visually checked by Codex, not an independent human. No threshold was tuned on this set. YOLO11s/960 experiments did not justify replacing YOLO11n 640/.45.

## Windows runtime and audit fixes

The previous Python packaging attempt stopped after Windows Code Integrity denied unsigned Polars and Contourpy modules. No protection changed and no denied binary was renamed or executed elsewhere. The **current deployed path is a genuine replacement** using official ONNX Runtime Web and Google MediaPipe WASM; it contains no Python or `.pyd` extensions. See `WINDOWS_RUNTIME_BLOCK.md` for the historical finding and `RUNTIME_WASM.md` for exact current provenance and measurements.

Implemented fixes include capture cancellation after every await, main-process consent/freshness gates, duplicate-start prevention, complete replay episode durations, own-key/prototype validation at nested report boundaries, serialized storage cleanup, independent snapshot consent, immutable calibration context, continuous-event debounce, preserved reviewer drafts and transparent source labels. Final source additionally deduplicates private CV host/model initialization and validates observations in main; these final two additions await native rerun after dependency setup. See `AUDIT_FIXES.md`.

Screenshots: `evidence/desktop-calibration.png`, `desktop-exam.png`, `desktop-worker-interruption.png`, `03-review.png`, `mobile-review-reason.png`, `04-capabilities.png`. The original short automated browser recording is not a judge-ready demonstration video.

## Remaining acceptance gaps

1. Consented annotated moving phone/head/eye clips; physical direction/sign accuracy, glasses, occlusion, benign movement false-event rate and phone aimed toward screen. Upper-position phone proxy is not a raising trajectory or intent detector.
2. Native active-exam revocation, undecoded/frozen tracks, storage failure and repeated cold-start/resource E2E; separate snapshot consent and complete keyboard/screen-reader/contrast checks. Some deterministic regressions pass; full realistic-device coverage remains open.
3. Fresh Windows/VM installation, actual network-denied testing, institution policy compatibility, release license inventory and final judge-ready demo recording. Package is unsigned; no certification claim.
4. Examiner authentication and multi-session archive/undo; current prototype keeps one session with explicit replacement/export and deletion confirmation. OS-account access is its storage boundary.
5. Authorized new public repository, remote CI/commit verification and free redacted static deployment. Connected GitHub account is `seoshiro`; exposed tools cannot create an empty repository. No credentials were extracted or minted; no earlier repo was reused.
6. Parent's final presentation, pitch and defense package after these limits are scoped honestly.

## Resume and run

Source directory: `ayqyn/` in this workspace. Node 24 and pnpm 11; `./scripts/setup.ps1` installs pinned dependencies and verified official models. Initial downloads need internet. `pnpm start` runs desktop; `pnpm package` builds the inference-inclusive Windows folder. Runtime assets are excluded from source ZIP and reconstructed with SHA checks. Historical Python benchmark files are not part of default setup or desktop execution.

Run existing packaged `AYQYN.exe` without installing Python. Camera stays off until explicit participant consent and button action. No microphone, global key hook, OS lock, organizer contact or real student data was used. Alt+Tab/Win/PrtScn are honestly marked unavailable as OS-wide enforcement. App clipboard/navigation blocking is scoped to active exam; emergency exit releases resources.

No native build or audit is intentionally left running. Static server on 127.0.0.1:4173 remains. A frozen pnpm reinstall was started after moving its cache inside the task; it recreated node_modules and is pending at handoff. Do not run concurrent installs. Existing release and runtime assets are preserved. Session ID 37261 can be polled; if it fails, rerun the frozen install with the task-local cache in an allowed process. The final startup hardening and updated disabled-camera/mobile-screenshot E2E require rerun. Recorded native/package/7-browser results precede those last additions; source and package are therefore not yet identical. Do not present the package as an exact-commit release.
