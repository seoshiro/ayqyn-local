/** Optional free audit-only tool, never packaged or executed by the public website. */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const url='https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js',expected='c24f097bd2f451d4f933e8bc7d8d539f8672a2ebcb5cc9f9f3eec8ca9470a0c1';
const response=await fetch(url);if(!response.ok)throw Error(`Audit download ${response.status}`);
const bytes=Buffer.from(await response.arrayBuffer()),sha256=crypto.createHash('sha256').update(bytes).digest('hex');if(sha256!==expected)throw Error('Audit-only axe checksum mismatch');
await fs.mkdir('data',{recursive:true});await fs.writeFile('data/axe-site.min.js',bytes);await fs.writeFile('data/axe-site-provenance.json',JSON.stringify({version:'4.13.0',url,bytes:bytes.length,sha256,license:'MPL-2.0'},null,2)+'\n');console.log(`Audit-only axe-core 4.13.0 verified: ${sha256}`);
