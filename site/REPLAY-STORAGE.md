# Public replay storage

The downloadable desktop app remains the immutable v0.2.3 application at d65abf9. `audit-app-invariants.mjs` verifies all 57 protected application inputs before each website build. The public replay alone receives a checked, deterministic storage adaptation from `scripts/replay-browser-storage.mjs`; authoring files under `web/` and `desktop/` are never rewritten.

Browsers with Web Locks serialize compare/write operations on the replay's `ayqyn-session` localStorage cache. A stale tab cannot overwrite or delete newer data. It displays a Russian warning that its changes were not saved and asks the reviewer to refresh. Refresh restores the current accepted decisions. Local quota/storage failures remain visible and can be retried.

Without Web Locks, the public replay uses independent sessionStorage per tab and explicitly says that closing the tab discards the example cache. There is no network backend, identity store, authenticated role, live camera or upload.

`PUBLIC-BUILD.json` identifies the released application source and separately records the website commit providing this browser-only adaptation. `PUBLIC-SITE.json` hashes the actual adapted renderer and storage module. Source is available in this repository under the same AGPL license.

Validation: four unit cases cover stale write/delete, simultaneous writers, quota retry and isolated fallback. The browser regression opens two real tabs, reproduces and rejects stale review/deletion, verifies refreshed recovery and actual no-Web-Locks fallback. This cache remains a public test-fixture demonstration, not a shared multi-reviewer service.
