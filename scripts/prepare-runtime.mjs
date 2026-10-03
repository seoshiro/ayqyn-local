import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve('.'),out=path.join(root,'web','runtime');await fs.mkdir(out,{recursive:true});
const expected=JSON.parse(await fs.readFile('web/runtime-manifest.json','utf8'));
const copies=[
 ['node_modules/onnxruntime-web/dist/ort.wasm.min.mjs','ort/ort.wasm.min.mjs','MIT','onnxruntime-web@1.30.0'],
 ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs','ort/ort-wasm-simd-threaded.mjs','MIT','onnxruntime-web@1.30.0'],
 ['node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm','ort/ort-wasm-simd-threaded.wasm','MIT','onnxruntime-web@1.30.0'],
 ['node_modules/@mediapipe/tasks-vision/vision_bundle.mjs','mediapipe/vision_bundle.mjs','Apache-2.0','@mediapipe/tasks-vision@1.0.1'],
 ...['vision_wasm_internal.js','vision_wasm_internal.wasm','vision_wasm_nosimd_internal.js','vision_wasm_nosimd_internal.wasm','vision_wasm_module_internal.js','vision_wasm_module_internal.wasm'].map(f=>['node_modules/@mediapipe/tasks-vision/wasm/'+f,'mediapipe/wasm/'+f,'Apache-2.0','@mediapipe/tasks-vision@1.0.1']),
 ['models/yolo11n.onnx','models/yolo11n.onnx','AGPL-3.0-only','official Ultralytics v8.3.0 assets'],
 ['models/face_landmarker.task','models/face_landmarker.task','Apache-2.0','official Google face_landmarker float16/1'],
];
const pins={'models/yolo11n.onnx':'634279b40c07c6391472c51ad45b81ebc48706a9a1fe72dd3396322acd0c053b','models/face_landmarker.task':'64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff'};
const assets=[];for(const [from,to,license,source] of copies){const data=await fs.readFile(from),sha256=crypto.createHash('sha256').update(data).digest('hex'),pin=expected.assets.find(a=>a.path==='runtime/'+to);if(!pin||sha256!==pin.sha256||data.length!==pin.bytes||(pins[from]&&sha256!==pins[from]))throw Error('Asset hash mismatch: '+from);const dest=path.join(out,to);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,data);assets.push({path:'runtime/'+to,sha256,bytes:data.length,license,source});}
const manifest={schema:1,runtime:'official Microsoft ONNX Runtime Web + Google MediaPipe WASM; no Python/Polars/Contourpy/PyTorch',packages:{'onnxruntime-web':'1.30.0','@mediapipe/tasks-vision':'1.0.1'},assets};
await fs.writeFile('web/runtime-manifest.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({assets:assets.length,bytes:assets.reduce((n,a)=>n+a.bytes,0),manifest:'web/runtime-manifest.json'}));
