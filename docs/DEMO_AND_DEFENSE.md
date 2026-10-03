# Three-minute demo and defense

**0:00–0:20:** Exam institutions need a local view of phone/presence/attention events and control inside the test app. A flag alone is not a fair decision.

**0:20–0:45:** Show the architecture diagram: video → private Python worker → YOLO and MediaPipe → quality/calibration/dwell → local journal → human review. No cloud camera upload and no microphone.

**0:45–2:05:** Create session; show evidence off by default and accessibility option. Explain consent and calibration. Native integration passed with a file-backed virtual camera; if demonstrating a physical camera, get action-time consent first. Show the native exam, Ctrl+C app blocking and emergency escape. Open replay with real CV missed-phone examples, a detected phone, quality degradation and reason-required review. Export image-free JSON. Always identify virtual-camera/replay sources clearly.

**2:05–2:40:** Display measured `evidence/cv-metrics.json`, test counts, screen captures and transparent limitations. State the independent photo count, correlated repeated frames, CPU/RAM and latency denominator. Do not call the smoke set general accuracy.

**2:40–3:00:** Proposed pilot, not a completed one: one ordinary lab PC, opt-in volunteers, short benign/target sequences, independent reviewers, measured false alarms and review workload; no automatic scores or discipline.

## Questions the captain should answer

**Does AYQYN stop Alt+Tab or Win?** No. It logs app blur and blocks only app-scoped navigation/clipboard. OS-wide filtering needs supported managed Windows configuration and administrator approval. We do not install hooks.

**Does a raised phone prove screen photography?** No. It is a box-position/size observation. Back/front phone ambiguity and occlusion are limitations; a reviewer considers context.

**How do you infer attention?** Head pose uses solvePnP on six facial landmarks and generic geometry; eyes use iris location relative to eye corners/lids. We compare to a personal baseline after quality checks, then require a sustained deviation. These are approximate geometric proxies, not identity or intent recognition.

**Why can your accuracy not be 99%?** Current smoke tests have eight scenes and transformed/repeated frames. Two real phone photos were missed by the first model run. Event precision/recall on independently annotated exam videos has not been measured. We retain failures and show exactly the sample denominator.

**Why does no face sometimes not mean absence?** Low light/blur, camera loss and worker failure make the sensor unhealthy. We pause attention/absence decisions, log a technical interruption and reset dwell after gaps.

**What is original?** The local evidence workflow, bounded state machine, calibration/quality/dwell, review and privacy controls. YOLO11n/MediaPipe are existing disclosed models; AI coding assistance is disclosed. The team must understand and verify the implementation.

**Can the student alter the journal?** An administrator or someone with source/file access can. This prototype does not offer signed evidence or institutional authentication. That is a pilot requirement, not a hidden guarantee.

**Who pays?** No paid APIs, cloud inference, certificates or subscriptions used. AGPL distribution requires corresponding source; MediaPipe has Apache-2.0 terms; fixture licenses and sources are documented.
