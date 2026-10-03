# Three-minute demo and defense — current WASM architecture

**0:00–0:20:** Institutions need local observations of phones, presence and sustained direction changes, plus scoped control inside the exam application. Each flag needs contextual human review.

**0:20–0:45:** Diagram: participant-approved camera → bounded private IPC → isolated sandboxed Electron CV renderer → official YOLO11n ONNX / ONNX Runtime Web CPU WASM and Google MediaPipe WASM → quality, individual calibration and dwell → local journal → reason-required human review. No microphone, cloud camera upload or Python runtime.

**0:45–2:05:** Create a session; show snapshot storage off by default and adaptable attention policy. Show separate camera/snapshot consent, loading/permission/frame readiness and calibration. Identify file-backed virtual camera explicitly. Show native exam, app Ctrl+C observation and emergency exit. Then open real-result photo replay, inspect the detected phone and ambiguous/missed examples, save a reviewer reason and export image-free JSON. Virtual/replay sources remain visible. Physical camera demonstration requires separate action-time consent.

**2:05–2:40:** Use `wasm-parity.json`, `wasm-runtime-audit.json`, current packaged/native/UI audit JSON and exact-build screenshot manifest. 32 frozen scenes matched the earlier PyTorch baseline in phone-presence and localization decisions. This is implementation parity, not independent accuracy. Small photo benchmark: 9/10 verified physical-phone scenes detected; 12/16 dataset positives localized at IoU ≥.3; 3/16 negatives falsely detected. Retain misses and show denominators.

WASM processing p50/p95 was 233.4/322.5 ms in the frozen 32-scene run on this CPU machine. That excludes renderer capture and IPC. The live prepared-frame → received-observation metric starts after canvas draw, before JPEG serialization, and ends when IPC returns; it excludes physical exposure, draw time and display paint. Dwell is a separate configurable waiting interval. Historical Python `cv-metrics.json` is not the current runtime metric source.

**2:40–3:00:** Proposed pilot: opt-in volunteers, annotated benign/target moving scenes, glasses/occlusion and small devices, independent reviewers, measured event-level false alarms and workload. A fresh-OS and physical network-disconnected run are also pending. No pilot, video accuracy or institutional security certification is asserted.

## Captain's defense

**Does it block Alt+Tab / Win / PrtScn?** It records focus/visibility loss and blocks clipboard/navigation inside the active app. OS-wide enforcement is unavailable. Supported managed Windows configuration is a separate administrator deployment; no hooks/policies were installed.

**Does an upper-frame phone prove photography?** No. It is a position/size proxy. Orientation, occlusion and intent remain ambiguous; there is no validated raising trajectory.

**How are head/eye observations produced?** MediaPipe returns geometric landmarks and a head transformation matrix. AYQYN converts the matrix to relative yaw/pitch/roll and computes iris position inside eye corners/lids. A stable individual baseline and healthy single face are required before dwell rules. Physical sign, glasses and event accuracy need annotated moving-video validation; deterministic matrix tests do not establish it.

**Why no impressive universal accuracy percentage?** Photo selection has 16 labelled positives and 16 negatives; ten positives are visually verified physical phones, four product graphics and two ambiguous devices. Codex visual review is not independent human ground truth. Video event precision/recall has not been established. Repeating stills does not add independent samples.

**Why can no face mean sensor failure?** Darkness, blur, missing frames or a CV crash invalidate sensing. AYQYN pauses presence/attention decisions, releases capture, resets dwell and records interruption rather than declaring absence.

**What did the team build?** The local consent/lifecycle state machine, calibration/quality/dwell rules, scoped exam guard, contextual review, bounded storage/export and reproducible audit workflow. Existing YOLO/MediaPipe models and AI coding assistance are disclosed; the team must explain and verify the code.

**Can evidence be altered?** A user with filesystem/source access or an administrator can tamper. The prototype has no institutional authentication or cryptographically signed evidence. Storage uses OS-account access and retention/deletion controls.

**What about Windows blocking Python modules?** The earlier packaging graph included unsigned Polars/Contourpy and Windows denied them. Build stopped. The deployed application genuinely replaces that path with official local WASM; no denied binary or policy was changed. This machine's package works; other institution policies are unverified and executable is unsigned.

**Is it free and licensed?** No paid inference, APIs, certificates or hosting subscriptions. AYQYN/YOLO distribution is AGPL with corresponding source; ORT Web is MIT, MediaPipe Apache-2.0. Exact notices and fixture attribution accompany distribution; upstream authors/models are not claimed as team work.
