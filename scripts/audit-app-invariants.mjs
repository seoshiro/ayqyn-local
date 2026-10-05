import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const baseline=JSON.parse(await fs.readFile('site/app-baseline.json','utf8'));
const release=JSON.parse(await fs.readFile('site/releases/v0.2.3.json','utf8'));
assert.equal(release.applicationSourceCommit,baseline.sourceCommit);
const git=(...args)=>execFileSync('git',['-c','safe.directory='+path.resolve('.'),...args],{maxBuffer:20_000_000});
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
assert.equal(git('rev-parse','v0.2.3^{commit}').toString().trim(),baseline.sourceCommit,'Published v0.2.3 tag must stay unchanged');
for(const row of baseline.files){const raw=git('show',baseline.sourceCommit+':'+row.path),bytes=row.canonicalTextLF?Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n')):raw;assert.equal(hash(bytes),row.sha256,`Released source changed: ${row.path}`);}
const detectorFiles=baseline.files.filter(row=>row.path.startsWith('web/cv/')||['web/core.js','web/schema.js','web/sensor.js','web/runtime-manifest.json','web/cv-host.html','desktop/cv-preload.cjs'].includes(row.path));
for(const row of detectorFiles){const raw=await fs.readFile(row.path),bytes=row.canonicalTextLF?Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n')):raw;assert.equal(hash(bytes),row.sha256,`Detector or machine-schema invariant changed: ${row.path}`);}
const previous=JSON.parse(git('show',baseline.sourceCommit+':package.json').toString());assert.deepEqual(JSON.parse(await fs.readFile('package.json','utf8')).dependencies,previous.dependencies,'CV dependency versions must stay unchanged');
console.log(JSON.stringify({passed:true,releasedApplicationCommit:baseline.sourceCommit,protectedReleasedFiles:baseline.files.length,unchangedDetectorAndSchemaFiles:detectorFiles.length,releasedVersion:release.version,candidateVersion:JSON.parse(await fs.readFile('package.json','utf8')).version}));
