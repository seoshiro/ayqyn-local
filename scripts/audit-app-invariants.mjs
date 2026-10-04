import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const baseline=JSON.parse(await fs.readFile('site/app-baseline.json','utf8'));
const release=JSON.parse(await fs.readFile('site/release.json','utf8'));
assert.equal(release.applicationSourceCommit,baseline.sourceCommit);
for(const row of baseline.files){const raw=await fs.readFile(row.path),bytes=row.canonicalTextLF?Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n')):raw;const hash=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(hash,row.sha256,`Application invariant changed: ${row.path}`);}
assert.equal(JSON.parse(await fs.readFile('package.json','utf8')).version,release.version);
console.log(JSON.stringify({passed:true,applicationSourceCommit:baseline.sourceCommit,protectedFiles:baseline.files.length,packagedSourceFiles:baseline.packagedSourceFiles,releaseVersion:release.version}));
