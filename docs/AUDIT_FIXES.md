# Independent audit reconciliation

This records implemented fixes and their verification, not a claim that the competition package is complete.

| Finding | Change | Evidence / remaining limit |
|---|---|---|
| Cancelled camera request could resurrect capture | `CaptureGate` generation checks after initialization, permission and getUserMedia; stale tracks stopped before assignment | Deterministic delayed-init/capture/consent regressions; physical camera not used |
| Revocation did not stop preview / exam could start without healthy frames | Checkbox revocation releases tracks/worker; exam requires consent and observation age ≤1500 ms in renderer and main | Native preview revocation prevents start; reconnect clears stale error and recalibrates |
| readyState=0 / frozen video could remain active forever | 8 s first-frame deadline, 3 s frame freshness and 4 s inference watchdog; track mute/end pauses sensing | FrameHealth tests; real device stalls and active-exam revocation still need full E2E |
| Nonuniform canvas stretch | Capture fits within 640×480 with original aspect ratio; overlay surface follows frame ratio | Native visible screenshot; independent aspect-ratio regression still pending |
| Malformed sessions / nested images leaked through export | Exact versioned key whitelist for session/events/observations/policy/provenance/segments; finite bounds, ISO dates, total snapshot budget 3 MB | Null events, invalid date, nested images, boolean/incomplete policy, Infinity and oversized image regressions |
| Temp crash residue survived deletion | Serialized store writes; owned `.tmp` removed on initialization/deletion; corrupt and expired `.json` removed | Filesystem regression |
| Unstable pitch/iris calibration accepted | Reject pitch and both iris spreads in addition to yaw; finite values and plausible iris range | Targeted alternating pitch/iris regressions; physical direction/sign accuracy still unvalidated |
| Continuous episode produced overlapping rows | One event per continuous observable quantity, duration updates, 450 ms exit hysteresis and restart cooldown | 20-second continuous episode regression |
| New calibration changed context of older events | Append immutable consent/calibration segments; new CV events reference segment ID | Schema checks; old imported v1 events remain explicitly without segment rather than reinterpreted |
| Optional images implied by policy | Separate participant snapshot checkbox, default off; capture also requires that consent; export always excludes snapshots | Implemented; separate checkbox E2E still pending |
| Still frame title overclaimed raising | Label changed to “Телефон в верхней части кадра” | Camera position proxy; no screen aim/photographing claim |
| Test/live source ambiguous | In-frame source badge; virtual-camera session source persisted; recorded-frame report stamp | Fresh native and browser screenshots |
| Error remained after successful readiness | Clear alert DOM as a new action starts | Native reconnect regression |
| Reviewer draft disappeared between events | In-memory draft keyed by event ID and focused reason field | Mobile event selection → draft → another event → return → export E2E |
| Session silently replaced/deleted | Replacement requires exporting current report; explicit deletion confirmation | Browser E2E; only one session retained, deletion undo/archive not implemented |
| Low secondary-text contrast | Darker paragraph/status/neutral-badge/observation text | Actual pixels inspected; automated full WCAG/keyboard/screen-reader audit still pending |
| Worker latency labelled end-to-end | UI measures canvas capture → received observation; separate worker processing timings retained | Capture age metric excludes physical exposure and display paint; do not label true sensor-to-overlay latency |
| Portable package omitted Python | Main now has a packaged worker location and writable runtime cache | Build blocked by Windows application control; no portable release or clean-machine pass |

At this checkpoint: **20 Node regressions, 7 browser checks and 10 native virtual-camera checks passed**. Native package compatibility remains blocked as described in `WINDOWS_RUNTIME_BLOCK.md`.
