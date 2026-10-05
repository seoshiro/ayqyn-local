import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {adaptReplayRenderer} from './replay-browser-storage.mjs';
const root=path.resolve('dist'),manifest=JSON.parse(await fs.readFile(path.join(root,'PUBLIC-SITE.json'),'utf8'));
const release=JSON.parse(await fs.readFile('site/release.json','utf8'));
assert.deepEqual(manifest.release,release);
assert.equal(manifest.applicationSourceCommit,'d65abf9c9c64bf81a9db162fbe9b89e4a899f94a');
for(const key of ['camera','microphone','analytics','externalRuntimeRequests'])assert.equal(manifest[key],false);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const row of manifest.files){assert.equal(hash(await fs.readFile(path.join(root,row.path))),row.sha256,row.path);assert(!/\.onnx$|\.wasm$|\.task$|(^|\/)runtime\//.test(row.path));}
const assets=JSON.parse(await fs.readFile('site/assets/provenance.json','utf8'));
for(const row of assets.files)assert.equal(hash(await fs.readFile(path.join(root,'assets',row.file))),row.sha256,`Published asset ${row.file}`);
const replay=JSON.parse(await fs.readFile(path.join(root,'replay/PUBLIC-BUILD.json'),'utf8'));
assert.equal(replay.sourceCommit,manifest.websiteCommit);
assert.equal(replay.camera,false);assert.equal(replay.localCV,false);assert.equal(replay.rawFixturePixels,false);
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
assert(html.includes('<html lang="ru">'));
assert(html.includes(release.sha256));assert(html.includes('194 021 562'));assert.equal((html.match(new RegExp(release.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,2);
const targets=[...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(m=>m[1]);
for(const target of targets){if(target.startsWith('https:')){assert(target.startsWith('https://github.com/seoshiro/ayqyn-local/'),`Unapproved remote destination: ${target}`);continue;}assert(target.startsWith('./'),`Base path unsafe: ${target}`);await fs.access(path.join(root,target.replace(/^\.\//,'').replace(/\/$/,'/index.html')));}
const script=await fs.readFile(path.join(root,'site.js'),'utf8');assert(!/\bfetch\s*\(|getUserMedia|localStorage|sessionStorage|sendBeacon|WebSocket/.test(script));
const source=await fs.readFile('web/app.js','utf8');assert.equal(hash(await fs.readFile(path.join(root,'replay/app.js'))),hash(Buffer.from(adaptReplayRenderer(source))));
assert.equal(hash(await fs.readFile(path.join(root,'replay/browser-storage.js'))),hash(await fs.readFile('site/browser-storage.js')));
assert.equal(replay.browserAdaptation.releasedV023Unchanged,true);
console.log(JSON.stringify({passed:true,publishedFiles:manifest.files.length+1,protectedApplicationCommit:release.applicationSourceCommit,replaySeparated:true,approvedScreenshotHashes:assets.files.filter(r=>r.file.endsWith('.png')).length,relativeAssets:true,downloadBytes:release.bytes,downloadSha256:release.sha256}));
