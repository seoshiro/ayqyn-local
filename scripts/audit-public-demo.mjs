import fs from 'node:fs/promises';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const manifest=JSON.parse(await fs.readFile('dist/PUBLIC-BUILD.json','utf8')),replay=JSON.parse(await fs.readFile('dist/fixtures/replay.json','utf8'));
assert.equal(manifest.rawFixturePixels,false);assert.equal(manifest.camera,false);assert.equal(manifest.localCV,false);assert.equal(manifest.files.length,6);
assert.match(replay.provenance.publicDisplay,/Synthetic diagrams/);assert.equal(replay.provenance.type,'real_wasm_inference_repeated_stills');
for(const row of manifest.files){const bytes=await fs.readFile('dist/fixtures/'+row.file),original=await fs.readFile('web/fixtures/'+row.original);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),row.sha256);assert.notDeepEqual(bytes,original);}
const walk=async directory=>{let result=[];for(const entry of await fs.readdir(directory,{withFileTypes:true})){const file=directory+'/'+entry.name;result.push(...(entry.isDirectory()?await walk(file):[file]));}return result;};const files=await walk('dist');
assert.equal(files.length,17);assert(files.includes("dist/diagnostics.js"));assert(!files.some(x=>/runtime|cv-host|\.wasm$|\.onnx$|\.task$|\.jpg$/.test(x)));assert(replay.observations.every(x=>/-diagram\.png$/.test(x.asset)));
console.log(JSON.stringify({passed:true,files:files.length,diagrams:6,rawFixturePixels:false,modelAssets:false}));
