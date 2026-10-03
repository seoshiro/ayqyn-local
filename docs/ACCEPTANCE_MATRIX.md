# Case 3: requirement, evidence and remaining validation

All signals are observations for a human reviewer. No student identity, emotion/demographic inference, automatic cheating decision, score or sanction. Source, fixture/live mode and model hashes accompany reports.

| Requirement | Working implementation/evidence | Limit / next validation |
|---|---|---|
| Phone visible in hand / in front of screen | Official YOLO11n ONNX class67; genuine WASM fixture outputs and frozen32-scene implementation comparison; live file-backed exam | Small selected still set, known misses and false positives; independent moving-video intervals needed |
| Phone raised / aimed at screen | Upper-frame bbox proxy, distinct event and explicit uncertainty | No validated raising trajectory, camera orientation or intent inference; partial requirement |
| Head/eye direction and sustained down/side | Google geometric face/head matrix and relative iris proxy; baseline, quality and dwell; rule/matrix tests | Physical direction sign, gaze accuracy, glasses and event-level benign false alarms await consented manual validation |
| Presence / second face | Actual Face Landmarker outputs for one/two/no faces; quality prevents dark/blur from being treated as absence | Real participant occlusion/light/driver conditions and event-level accuracy unvalidated |
| Ctrl+C/V and navigation/window controls | Electron active-exam input guard, navigation/window denial, observable guard events; packaged native tests | App scope; OS Alt+Tab/Win/PrtScn and other processes remain available. Managed Windows guidance is inactive |
| Local working prototype | Versioned Windows x64 package,12 pinned assets, exact source-file manifest and corresponding source; production copied-folder/PATH and standard hosted Windows CI | Unsigned; bare institutional OS/driver/physical air-gap not certified |
| Complete session and review flow | Consent/readiness/calibration, exam timeline, required reason, native atomic image-free export, recovery/delete | No examiner authentication or multi-session archive; source/commit-specific reports required |
| Privacy and accessibility | No microphone/cloud camera; separate snapshot opt-in; bounded evidence; inline validation, keyboard/history, inactive media hidden and sampled AX/contrast/reflow checks | Full screen-reader/physical-touch/participant accessibility review remains open |

The public replay uses six actual WASM still-image outputs repeated to exercise dwell and shows synthetic diagrams with no original photo pixels. Archived v0.2.0 browser screenshots show historical genuine Python outputs and are labelled separately. Neither repetition nor synthetic diagram is independent accuracy or contextual video evidence.

Before a pilot: explicitly consented adults, independent interval labels, representative benign movements, glasses/occlusion/light/device variations, event matching criteria fixed before evaluation and human-reviewed reasons. Use MANUAL_VALIDATION.md for the initial5–10minute check. No organizer submission or registration has occurred.
