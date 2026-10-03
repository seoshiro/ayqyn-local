# Windows runtime blocker — 2026-10-03

The unsigned Windows distribution is **not ready**. Do not disable Windows protection, add exclusions, approve unknown binaries, rename a denied module, or copy it elsewhere to evade application control.

## Verified evidence

- Windows Code Integrity Operational events **3033 and 3077** identify `_polars_runtime_32/_polars_runtime.pyd` as failing the signing level / code integrity policy. The binary's Authenticode result is `NotSigned`.
- Installed distribution: `polars-runtime-32` **1.44.2**, MIT; installed by pip as a dependency of `polars` **1.44.2**, declared by `ultralytics` **8.4.14** (`polars>=0.20.0`).
- File size **175,884,800 bytes**. SHA256 **be609702dbe5a346607f4d6ab4497339f2d337466074f9b25517b6ec063b2d8e** matches the installed wheel's RECORD entry `vmCXAtvlo0Zgf01qtElzOfLTN0ZgdPmyVRe27AY7LY4`. This confirms installed-package consistency; it does not override Windows publisher trust or establish that every dependency is safe.
- Static source inspection finds Polars imports in Ultralytics tabular exports (`DataExportMixin.to_df/to_csv`), training metrics, plotting/benchmark helpers and optional callbacks. AYQYN uses `predict()` and reads tensor boxes, then Python's standard JSON encoder; it does not use those DataFrame, training or plotting-export features.
- PyInstaller dependency analysis was running when repeated loading failures appeared. A final build warning was `Polars binary is missing!`. The packaging process was stopped; no usable worker executable was produced.
- A separate event identifies `_contourpy.cp312-win_amd64.pyd`, a Matplotlib plotting dependency. Therefore removing Polars alone would not establish package compatibility.
- Redacted event times and IDs are in `evidence/windows-code-integrity.json`. Raw device/user/policy identifiers are omitted.

No claim of malware or a false positive is made. No Windows security policy was changed. The earlier Electron `0xC0000005` crash remains a separate incident with an unproven cause; this event is not evidence of defective RAM.

## Effects on verification

The actual desktop virtual-camera scenario completed **10/10 checks**; the minimal inference path returned real YOLO/MediaPipe observations despite the packaging failure. This does **not** prove that a packaged executable or a clean Windows installation will work. Stop new native build/testing attempts until the denied dependencies have been removed from the executable's actual dependency graph or an approved supported runtime has been chosen.

Browser/static-demo and Node rule/schema/lifecycle/storage tests do not load Python extensions and remain independently usable.

## Safe next architecture work

1. Produce an inference-only dependency graph that omits unused tabular and plotting features entirely. Do not bundle or load the denied extensions. Merely hiding their warnings is insufficient.
2. Consider an official, reproducibly exported YOLO ONNX model with OpenCV DNN or a supported ONNX runtime, plus MediaPipe. This is an architectural replacement of the runtime; keep AGPL attribution, pin the exported model and verify preprocessing/NMS and output parity on the same fixtures before adoption.
3. Confirm that the chosen replacement's own native dependencies meet the current Windows policy, then run a fresh offline/clean-install test. Do not promise compatibility in advance.
4. Preserve the current prototype and measured results until parity is demonstrated. A replacement runtime must continue performing real inference.

Primary references: [Ultralytics project](https://github.com/ultralytics/ultralytics), [Polars](https://github.com/pola-rs/polars), [PyInstaller packaging](https://pyinstaller.org/en/stable/usage.html), [Ultralytics prediction](https://docs.ultralytics.com/modes/predict/).
