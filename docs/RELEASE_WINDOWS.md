# Windows release 0.2.0

This unsigned prototype targets Windows x64. It was tested on the current Windows 11 machine, including a copied-folder launch with Node/Python absent from PATH. A fresh Windows installation and physical air-gap have not been verified. Do not interpret this as institution-wide compatibility or signed/approved software.

Download the versioned archive from the repository release, compare SHA256 with SHA256SUMS.txt, extract the whole folder and launch AYQYN.exe. Keep resources beside the executable. The package includes the official ONNX Runtime Web and MediaPipe WASM, both pinned models, notices and exact corresponding source. No Python, Polars or Contourpy are used by the application. The historical Python benchmark scripts remain in corresponding source for provenance only.

Camera starts only after consent and the user's action. No microphone. Snapshots have separate opt-in and default off. Fullscreen also defaults off. Click «Прервать» to release capture and app exam mode. Ctrl+Shift+Esc is an app shortcut only when the OS delivers it; use the visible button for reliable exit.

The app requests local resources only; both renderer sessions deny outbound HTTP and production probes were rejected. Internet is needed for the initial archive/source dependency download. Offline assets are already bundled. Physical disconnected-network testing remains open.

Some Windows/institution policies reject unsigned programs. If the program cannot launch, record the error and ask the institution's administrator to evaluate distribution. Do not disable security, change Code Integrity/SmartScreen rules or bypass a block. No certificates, paid services or protection changes are part of this prototype.

Tests demonstrate software behavior with licensed test photos and a clearly labelled file-backed virtual camera. Head/eye physical accuracy, phone raising/aim motion and event-level false-alarm rates remain unvalidated. Signals are observations for a human reviewer, not misconduct findings or student decisions. For an explicitly consented physical test see MANUAL_VALIDATION.md.

Release binaries identify their source in the UI/provenance. Public replay may be a later source commit and uses stored WASM outputs with synthetic diagrams; it does not run a camera or live inference. Check both commit stamps before comparing evidence.
