# Runtime attribution and transformation provenance

AYQYN source is AGPL-3.0-only. Upstream models and runtimes are disclosed components; the team did not train these models. Exact model/runtime bytes and licenses are enumerated in `web/runtime-manifest.json`; upstream notice bytes, source URLs and SHA256 are in `licenses/sources.json`.

| Distributed component | Exact source / license | Transformation |
|---|---|---|
| YOLO11n ONNX, 10,930,182 bytes | Official Ultralytics assets v8.3.0 `yolo11n.onnx`; metadata exporter 8.3.237, 2025-12-12; AGPL-3.0 | Unmodified downloaded ONNX. No local export, retraining or quantization. AYQYN implements JPEG decode, rect640 letterbox/RGB normalization, class67 filtering and NMS separately |
| Face Landmarker float16/1, 3,758,596 bytes | Official Google model bundle; Apache-2.0 | Unmodified `.task`. Geometric transform/iris observations only; `outputFaceBlendshapes:false` |
| ONNX Runtime Web 1.30.0 | Official npm package; MIT | Three unmodified JS/WASM files copied, pinned by hash; CPU single thread, proxy disabled |
| MediaPipe Tasks Vision 1.0.1 | Official npm package; Apache-2.0 | Unmodified ES module and six JS/WASM support files copied with SHA pins |
| Electron 44.5.1 | Official Electron binary; MIT plus Chromium notices | Unsigned packaging via @electron/packager; root Electron LICENSE and LICENSES.chromium.html retained |
| Test photos | `web/fixtures/attribution.json`, evaluation manifests | Resized/metadata-stripped or explicitly derived composites. CC-BY-SA file retains its terms. Public replay display must be redacted and marked as such |

YOLO ONNX SHA256: `634279b40c07c6391472c51ad45b81ebc48706a9a1fe72dd3396322acd0c053b`.
Face task SHA256: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
The earlier PyTorch baseline used the separately pinned `.pt`; it is historical evaluation input, absent from production runtime. 32-scene decision/localization matching is implementation parity, not independent video accuracy or bit-identical export equality.

Exact text files: `ultralytics-LICENSE.txt`, `onnxruntime-LICENSE.txt`, `onnxruntime-ThirdPartyNotices.txt`, `mediapipe-LICENSE.txt`. ORT umbrella notices are retained in full without asserting every optional native component is used in WASM. Google npm package has an Apache license field and no separate LICENSE file; repository LICENSE (including its additional notices) is included unchanged, with retrieval hash. No notice was shortened or translated.

Google's model cards explicitly license the bundled [BlazeFace](https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20%28Short%20Range%29.pdf), [Face Mesh V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf) and [Blendshape V2](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Blendshape%20V2.pdf) under Apache-2.0. The latter ships in Google's bundle but its output is disabled here. The cards emphasize front-facing/near-camera geometry and limitations at large angles/occlusion; institutional proctoring performance is not established by their AR benchmarks.

The [MediaPipe privacy notice](https://github.com/google-ai-edge/mediapipe#privacy-notice) distinguishes local input processing from SDK usage/performance metrics. AYQYN separately denies outbound requests in both renderer sessions and uses local asset URLs/CSP; recorded request audits must be consulted for the tested run. No claim that the upstream SDK inherently sends no telemetry is made.

Windows distribution includes `CORRESPONDING-SOURCE.zip` for the exact clean source commit, this attribution, fixture metadata and all available notices. `BUILD-INFO.json` stamps the source commit and runtime-manifest digest. Source archive alone excludes models/runtime binaries and uses SHA-verified first-run setup; it is not a runnable binary package. No paid license, service, API or signing certificate was purchased.
