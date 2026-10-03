import fs from 'node:fs/promises';import crypto from 'node:crypto';
const assets=[
 ['onnxruntime-LICENSE.txt','https://raw.githubusercontent.com/microsoft/onnxruntime/v1.30.0/LICENSE'],
 ['onnxruntime-ThirdPartyNotices.txt','https://raw.githubusercontent.com/microsoft/onnxruntime/v1.30.0/ThirdPartyNotices.txt'],
 ['mediapipe-LICENSE.txt','https://raw.githubusercontent.com/google-ai-edge/mediapipe/master/LICENSE'],
 ['ultralytics-LICENSE.txt','https://raw.githubusercontent.com/ultralytics/ultralytics/v8.3.237/LICENSE'],
];
await fs.mkdir('licenses',{recursive:true});const records=[];
for(const [file,url] of assets){const response=await fetch(url);if(!response.ok)throw Error('Notice download failed '+response.status+' '+url);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100||bytes.length>2_000_000)throw Error('Invalid notice size');await fs.writeFile('licenses/'+file,bytes);records.push({file,url,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
await fs.writeFile('licenses/sources.json',JSON.stringify({retrievedAt:new Date().toISOString(),note:'Exact upstream notice bytes. MediaPipe upstream LICENSE is Apache-2.0; npm package carries its license field but no separate LICENSE file. Full ORT umbrella notices retained without claiming every native optional component is used by CPU WebAssembly.',records},null,2)+'\n');console.log(JSON.stringify(records));
