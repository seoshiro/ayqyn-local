import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const assets=[
 {filename:'yolo11n.onnx',url:'https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.onnx',sha256:'634279b40c07c6391472c51ad45b81ebc48706a9a1fe72dd3396322acd0c053b',license:'AGPL-3.0-only'},
 {filename:'face_landmarker.task',url:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',sha256:'64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',license:'Apache-2.0'}
];
await fs.mkdir('models',{recursive:true});for(const asset of assets){const file=path.join('models',asset.filename);let bytes;try{bytes=await fs.readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;const response=await fetch(asset.url);if(!response.ok)throw Error('Model download failed: '+response.status);bytes=Buffer.from(await response.arrayBuffer());if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Downloaded model hash mismatch');await fs.writeFile(file,bytes);}
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Model hash mismatch: '+asset.filename);console.log(asset.filename,bytes.length,asset.sha256);
}

