# Security and privacy audit — checkpoint

Trust boundary: the OS account, administrator, bundled source and pinned models are trusted. Camera images are untrusted data. Python decodes bounded JPEG input, checks dimensions, never opens devices, uses CPU inference and outputs bounded structured observations. Runtime is configured offline; dependencies still need a network-denied run to prove no accidental outbound traffic.

Renderer uses secure custom scheme, CSP, Node integration disabled, sandbox and context isolation. Main denies remote navigation, popups and webviews. IPC checks the sender and main frame. Permission callback accepts only video after explicit consent. No clipboard contents or key text is logged, only category-level guard events. Audio permission is denied.

File saves use temp+rename for crash tolerance; data path is fixed, not renderer supplied. Current session is the only retained session in this version. Local files are protected by OS account permissions, not encryption. An OS administrator or participant who can edit source/files can tamper with the session or evidence; no signature establishes exam integrity. Images are optional and excluded from report export.

## Findings

| Finding | Action/status |
|---|---|
| Model setup originally repinned whatever bytes existed | Fixed: verified expected hashes now embedded in download script. |
| Old worker exit could clear a replacement worker | Fixed: worker exit/error scoped to owned child instance. |
| Default test app data outside workspace | Fixed test paths; test software rendering enabled. Cause of native crash not yet established. |
| Dark camera could resemble absent face | Quality gating prevents absence/attention on unusable frames; tested. |
| Sensor gap could accumulate absence dwell | Gap >1500 ms resets pending dwell; tested. |
| Raw event snapshot could appear in export | Report strips snapshot fields; tested and inspected exported JSON. |
| No multi-user examiner/participant authentication | Prototype limitation; not trusted for real institutional exams. |
| Copyguard and OS capabilities confused | Explicit UI distinguishes app blocking, observed loss of focus and unsupported OS blocking. |
| New session replaces current session | Current one-session prototype; warn/offer archive before pilot. |
| Data retention only on reopening | Explicit UX/docs. No background deletion service. |

## Before pilot

Independently review IPC/permissions, add offline network proof and worker-crash recovery E2E, separate examiner authentication, institutional consent/retention process, verified managed-device policy and clean-machine installation. Do not activate keyboard hooks, process termination, OS kiosk policy, security changes or lock mode without separate action-time approval.

Electron test crash on this machine: restricted test process exit **3221225477 / 0xC0000005**, before first application window. Recent Application error query contained no matching entry, so a faulting module/cause is not known. It is not evidence of defective physical RAM. A single isolated verification with task-local userData, software rendering, permitted process launch and process-local crash-dialog suppression subsequently passed all 7 native checks. No OS security/settings changes and no physical camera access. Those changes are a verified test mitigation; the exact original cause is not proven.
# Runtime update v0.2

Current inference runs inside a separate sandboxed Electron renderer with official ONNX Runtime Web/MediaPipe WASM, not Python pipes. It has no camera/media permission or external network access. Main validates sender, consent, monotonic timestamp, payload bounds and observation schema; model/runtime bytes have SHA256 pins. Local administrator tampering, unsigned distribution, JPEG decoding resource attacks and institutional policy compatibility remain limitations. Historical references to a Python worker below apply to the earlier development benchmark, not current execution. See `ARCHITECTURE.md` and `RUNTIME_WASM.md` for the current path.
