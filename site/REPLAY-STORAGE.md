# Public replay storage

The downloadable desktop app remains the immutable v0.2.3 application at d65abf9. `audit-app-invariants.mjs` verifies all 57 protected application inputs before each website build. The public replay alone receives a checked, deterministic storage adaptation from `scripts/replay-browser-storage.mjs`; authoring files under `web/` and `desktop/` are never rewritten.

Browsers with Web Locks serialize compare/write operations on the replay's `ayqyn-session` localStorage cache. A stale tab cannot overwrite or delete newer data. It displays a Russian warning that its changes were not saved and asks the reviewer to refresh. Refresh restores the current accepted decisions. Local quota/storage failures remain visible and can be retried.

Without Web Locks, the public replay uses independent sessionStorage per tab and explicitly says that closing the tab discards the example cache. There is no network backend, identity store, authenticated role, live camera or upload.

`PUBLIC-BUILD.json` identifies the released application source and separately records the website commit providing this browser-only adaptation. `PUBLIC-SITE.json` hashes the actual adapted renderer and storage module. Source is available in this repository under the same AGPL license.

Export uses the same lock and canonical revision comparison. It first flushes a pending same-tab autosave, then refuses an outdated tab or any local session that differs from its accepted stored revision. A failed or rejected save cannot become an exported accepted decision. Storage read failure also prevents download. Reload recovers canonical decisions. The report is a snapshot of the accepted revision at export time; later decisions do not rewrite already downloaded files.

Browser download initiation is labelled “file prepared; check saving in browser downloads.” The website cannot observe a user's Save As cancellation or promise that a file reached disk. A failed freshness check shows “report not created,” preserves the local session and newer stored data, and creates no download. The released native Save/Cancel behavior is unchanged.

Validation covers stale write/delete/export, simultaneous writers, accepted versus dirty/rejected revisions, storage failures and isolated fallback. Actual browser regressions exercise both independent-reviewer export reproductions, reload recovery, pending autosave, quota/read failures and download cancellation. This cache remains a public test-fixture demonstration, not a shared multi-reviewer service.
