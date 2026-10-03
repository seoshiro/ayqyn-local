# Minimal local runtime — 2026-10-03

The current desktop CV path uses **official ONNX Runtime Web 1.30.0 and Google MediaPipe Tasks Vision 1.0.1**, both WebAssembly, in a hidden sandboxed Electron renderer with a separate session. Python, PyTorch, Polars, Matplotlib and Contourpy are absent from the deployed runtime. No forbidden extension was renamed, relocated or permitted. The old Python code is historical benchmark material and is not called by the app.

## Model provenance and matching

The YOLO11n ONNX file comes directly from the [official Ultralytics v8.3.0 assets release](https://github.com/ultralytics/assets/releases/tag/v8.3.0); SHA256 `634279b40c07c6391472c51ad45b81ebc48706a9a1fe72dd3396322acd0c053b`, 10,930,182 bytes. Model metadata names Ultralytics, AGPL-3.0, version 8.3.237, dynamic NCHW input, stride 32 and 80 COCO classes with `cell phone` at 67. No local export through the blocked Python path was performed.

The same Google float16/1 Face Landmarker task remains pinned. Runtime JS/WASM and both models are listed with hashes, exact package versions and licenses in `web/runtime-manifest.json`. Setup compares downloaded bytes to those fixed pins; the Electron host verifies every asset before loading it. Runtime uses only local URLs and denies outbound network requests and all media permissions in the CV renderer.

Phone preprocessing preserves aspect ratio, uses stride-32 rectangular letterbox, RGB/255 NCHW, 114 padding, best-class filtering, confidence .45 and phone-class NMS IoU .7. The implementation reads numeric ONNX outputs rather than using Ultralytics tabular/plotting code. The 32 frozen licensed image scenes matched the stored PyTorch baseline in **32/32 presence decisions and 32/32 localization decisions**. Minimum paired-box IoU was **.99056**, maximum confidence difference **.0325**. These are detection-level parity checks, not bit-exact tensor equality; browser JPEG decoding/interpolation can differ.

The measured small photo results therefore remain **9/10 verified physical-phone photographs detected; 3/16 negatives falsely detected; 12/16 dataset-labelled positives localized**. No generalized accuracy or exam-video claim. WASM worker processing p50/p95 on these scenes: **233.4/322.5 ms**, single thread, same Windows machine. Initialization was about **0.67–0.69 seconds** in the recorded runs. This processing timing excludes renderer capture and IPC; separate capture-age data is logged in live sessions.

MediaPipe's geometric transformation matrix now supplies relative head orientation. No expression/blendshape output is enabled. Pitch/yaw unit/sign arithmetic has deterministic matrix tests; physical gaze/head-angle accuracy, glasses and moving-video performance still require labelled verification. This geometry revision is captured per new calibration segment; older events are not reinterpreted.

## Verification completed

- Real ONNX + Face Landmarker inference on original/derived licensed still fixtures: one face, two-face composite, visible phone, dark/blur quality gating. No camera opened.
- 10 native end-to-end checks with the explicit file-backed virtual camera: consent, calibration, preview revocation, recovery, app copy guard, storage, CV-host crash recovery, stop and emergency exit.
- Actual renderer delayed-exam-IPC regressions: Stop, revoke and navigation cannot resurrect an active exam; duplicate start is disabled and native mode is unwound.
- 27 Node regressions including prototype-like JSON names and complete replay episode durations.
- Windows package launched from a separate copied directory with Python and Node absent from PATH. Real phone inference, local storage and deletion passed: **5 checks**.

The last packaged run occurred under unchanged Windows protection. Follow-up Code Integrity inspection found no new matching loading failures during the WASM-only runs. A complete fresh-OS/VM test and physical network-disconnected run have **not** been performed. The copied-directory test is an isolation check on this machine, not a clean OS certification. The resulting executable is unsigned; compatibility with other institutional policies is not promised.

## Offline use

The Windows release folder includes all inference assets. Run `AYQYN.exe`; no Python installation is needed. Camera stays off until participant consent and a button action. Source setup needs Node 24 and pnpm 11, then `./scripts/setup.ps1`; initial dependency/model downloads need internet. After setup the local app requires no network.

Primary runtime references: [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/), [runtime environment flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html), [Google Face Landmarker Web](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js).
