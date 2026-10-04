# AYQYN public website

This directory is the website only. The released application remains frozen to `d65abf9c9c64bf81a9db162fbe9b89e4a899f94a` (v0.2.3). Its source, dependencies, interface, flows, release archive and tag are unchanged.

Run `node scripts/build-site.mjs`, then `node scripts/audit-site-build.mjs`, then `node scripts/serve-site.mjs`. Open `http://127.0.0.1:4176/ayqyn-local/`. The production base is `/ayqyn-local/`; all local asset and replay links are relative.

The existing, unchanged public replay is built from `web/` by `scripts/build-demo.mjs`, audited by its original whitelist audit, and moved to `dist/replay/`. The replay contains frozen genuine WASM observations on repeated public-photo stills and synthetic illustration pixels. It has no live camera or local CV. `replay/PUBLIC-BUILD.json` pins the original application commit. `PUBLIC-SITE.json` separately records the website build commit and file hashes.

`app-baseline.json` protects 57 application Git blobs, including all 53 packaged source files. Text hashes use canonical LF, matching Git and the immutable release; Windows checkout CRLF is normalized only for verification. No application files are rewritten. `release.json` pins the published Windows archive name, exact byte count and SHA-256. A website update must not repackage or relabel the application.

The four screenshot PNGs are byte-identical public v0.2.3 release assets. They show isolated, explicitly labelled test sessions on repeated public-photo fixtures, with no student or personal camera data. Their source URLs and hashes are in `assets/provenance.json`. They demonstrate UI and actual previously recorded local processing; they are not a moving-participant accuracy evaluation. Screenshot attribution remains in the corresponding application source/release. Onest is self-hosted under SIL OFL 1.1 (`assets/OFL-Onest.txt`); its official source URL and hash are also recorded.

No analytics, accounts, remote fonts, camera, microphone, storage or backend are used on this landing page. The clipboard button operates only after an explicit click and reports denial. Without JavaScript, all walkthrough sections and download links remain available. With JavaScript, tabs follow the WAI APG horizontal automatic-activation pattern, including Left/Right/Home/End. Reduced motion disables animation and smooth scrolling. All full-size screenshot links announce the new tab.

Design references were inspected visually: the author's portfolio and PERCH/LUMEN/RESON/ORBIT sites. This implementation is original and does not copy their assets or source. It uses restrained typography, a continuous grid, real application evidence and explicit capability boundaries.

Release downloads are hosted on GitHub. The unsigned portable build may be restricted by a device's security policy; the website provides no security bypass instructions. Physical camera, moving-participant accuracy, managed OS enforcement and a fresh OS installation are outside this website audit.

For local browser auditing, optionally run `node scripts/fetch-site-audit-tool.mjs` (downloads a pinned SHA-verified axe-core 4.13.0 audit script into ignored `data/`), set `AYQYN_AXE_PATH=data/axe-site.min.js`, and run `node scripts/audit-site-ui.mjs` while the preview server is running. This is a network-dependent preparation step; the site itself has no external runtime requests. Screenshots, JSON results and optional interaction recordings remain in ignored `artifacts/`. CI runs the same production-base browser audit.

The website was authored and tested with Codex AI assistance. Public copy distinguishes observable events from conclusions about intent, and distinguishes application restrictions from OS enforcement. Human review of the design, boundaries and test results remains necessary.
