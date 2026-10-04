/** Website and immutable replay build. Application authoring sources are never rewritten. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {adaptReplayRenderer} from './replay-browser-storage.mjs';
const release=JSON.parse(await fs.readFile('site/release.json','utf8'));
execFileSync(process.execPath,['scripts/audit-app-invariants.mjs'],{stdio:'inherit'});
for(const script of ['scripts/build-demo.mjs','scripts/audit-public-demo.mjs'])execFileSync(process.execPath,[script],{stdio:'inherit',env:{...process.env,GITHUB_SHA:release.applicationSourceCommit}});
const root=path.resolve('dist');
const entries=await fs.readdir(root);
await fs.mkdir(path.join(root,'replay'));
for(const entry of entries)await fs.rename(path.join(root,entry),path.join(root,'replay',entry));
// The public replay receives concurrency-safe browser caching. The released
// desktop source, package, version and download bytes stay at the frozen commit.
const renderer=await fs.readFile(path.join(root,'replay/app.js'),'utf8');
await fs.writeFile(path.join(root,'replay/app.js'),adaptReplayRenderer(renderer));
await fs.copyFile('site/browser-storage.js',path.join(root,'replay/browser-storage.js'));
const replayManifest=JSON.parse(await fs.readFile(path.join(root,'replay/PUBLIC-BUILD.json'),'utf8'));
replayManifest.browserAdaptation={websiteCommit:process.env.GITHUB_SHA||'local-candidate',purpose:'Stale concurrent browser writes rejected under Web Locks; per-tab sessionStorage fallback without Web Locks',packagedDesktopUnchanged:true};
await fs.writeFile(path.join(root,'replay/PUBLIC-BUILD.json'),JSON.stringify(replayManifest,null,2)+'\n');
for(const name of ['index.html','style.css','site.js','favicon.svg','release.json','assets'])await fs.cp(path.join('site',name),path.join(root,name),{recursive:true});
const files=[];
async function walk(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())await walk(file);else{const bytes=await fs.readFile(file);files.push({path:path.relative(root,file).split(path.sep).join('/'),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}}}
await walk(root);
await fs.writeFile(path.join(root,'PUBLIC-SITE.json'),JSON.stringify({schema:1,websiteCommit:process.env.GITHUB_SHA||'local-candidate',applicationSourceCommit:release.applicationSourceCommit,release,replayPath:'replay/',camera:false,microphone:false,analytics:false,externalRuntimeRequests:false,screenshots:'Unmodified released v0.2.3 test-fixture screenshots; repeated public-photo stills, no students, no motion/intent accuracy claim.',files},null,2)+'\n');
console.log(`Website: ${files.length} files, separate replay/, immutable app ${release.applicationSourceCommit.slice(0,7)}.`);
