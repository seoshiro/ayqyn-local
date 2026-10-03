/** Freeze actual WASM audit outputs. Repetition exercises dwell rules, not video accuracy. */
import fs from 'node:fs/promises';import crypto from 'node:crypto';
const input=await fs.readFile('evidence/wasm-runtime-audit.json'),audit=JSON.parse(input);
if(!audit.passed||audit.results.length!==6||audit.results.some(x=>x.observation.source!=='real_inference'))throw Error('A successful actual WASM audit is required');
const observations=[];let at=0;
for(const row of audit.results)for(let repeat=0;repeat<18;repeat++){at+=200;observations.push({at,asset:'fixtures/'+row.file,observation:structuredClone(row.observation)});}
const provenance={type:'real_wasm_inference_repeated_stills',runtime:'ONNX Runtime Web 1.30.0 + MediaPipe Tasks Vision 1.0.1; audited source 315d7d7',model:'Official YOLO11n ONNX + Google Face Landmarker WASM',sha256:audit.initialization.provenance.sha256,attribution:'fixtures/attribution.json',methodology:'Six genuine still-image inference outputs, each repeated 18 times to exercise dwell rules. No new inference on repeated rows. Not moving-video, exam or physical head/gaze accuracy. Original audit SHA256 '+crypto.createHash('sha256').update(input).digest('hex')};
await fs.writeFile('web/fixtures/replay.json',JSON.stringify({schema:1,provenance,observations},null,2)+'\n');
console.log('Replay refreshed from six actual WASM fixture outputs; repetitions explicitly labelled.');
