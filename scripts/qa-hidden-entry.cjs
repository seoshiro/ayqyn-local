// QA only. Preserve the actual main/renderer/CV/IPC; keep test windows off the participant desktop.
// This entry is never used by the production app or its package.
const {BrowserWindow}=require('electron');
for(const method of ['show','showInactive','focus','moveTop'])BrowserWindow.prototype[method]=function(){};
require(require('node:path').resolve(process.env.AYQYN_QA_MAIN||'desktop/main.cjs'));
