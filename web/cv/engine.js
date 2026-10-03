import * as ort from '../runtime/ort/ort.wasm.min.mjs';
import {FaceLandmarker,FilesetResolver} from '../runtime/mediapipe/vision_bundle.mjs';
import {letterboxShape,imageTensor,phonesFromTensor,frameQuality,faceGeometry} from './math.js';
export class LocalVision{
 async initialize(){
  const start=performance.now();ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=new URL('../runtime/ort/',import.meta.url).href;
  this.yolo=await ort.InferenceSession.create(new URL('../runtime/models/yolo11n.onnx',import.meta.url).href,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  if(this.yolo.inputNames.length!==1||this.yolo.inputNames[0]!=='images'||this.yolo.outputNames[0]!=='output0')throw Error('Unsupported model interface');
  const files=await FilesetResolver.forVisionTasks(new URL('../runtime/mediapipe/wasm/',import.meta.url).href);
  this.face=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:new URL('../runtime/models/face_landmarker.task',import.meta.url).href,delegate:'CPU'},runningMode:'VIDEO',numFaces:2,minFaceDetectionConfidence:.5,minFacePresenceConfidence:.5,minTrackingConfidence:.5,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:true});
  this.lastTimestamp=-1;this.smoothed=null;this.canvas=document.createElement('canvas');return {ready:true,phoneClass:67,runtime:'ONNX Runtime Web 1.30.0 + MediaPipe WASM 1.0.1',inputMetadata:this.yolo.inputMetadata,initMs:performance.now()-start};
 }
 async infer(encoded,timestamp){
  if(!this.yolo||!this.face)throw Error('Not initialized');if(!Number.isSafeInteger(timestamp)||timestamp<=this.lastTimestamp)throw Error('Nonmonotonic timestamp');this.lastTimestamp=timestamp;
  if(typeof encoded!=='string'||encoded.length>2_000_000)throw Error('Frame too large');const started=performance.now(),bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),image=await createImageBitmap(new Blob([bytes],{type:'image/jpeg'}));
  const w=image.width,h=image.height,shape=letterboxShape(w,h);this.canvas.width=w;this.canvas.height=h;const ctx=this.canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);image.close();
  const pixels=ctx.getImageData(0,0,w,h).data,quality=frameQuality(pixels,w,h),input=imageTensor(pixels,w,h,shape),tensor=new ort.Tensor('float32',input,[1,3,shape.height,shape.width]);
  const processing=performance.now(),outputs=await this.yolo.run({images:tensor}),result=outputs.output0,phones=phonesFromTensor(result.data,result.dims,shape,w,h);
  const faces=this.face.detectForVideo(this.canvas,timestamp),landmarks=faces.faceLandmarks,faceBoxes=landmarks.map(points=>[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))]);let pose=null,eyes=null;
  if(landmarks.length===1){const b=faceBoxes[0];if((b[2]-b[0])*(b[3]-b[1])<.035)Object.assign(quality,{usable:false,reason:'face_too_small'});const geometry=faceGeometry(landmarks[0],faces.facialTransformationMatrixes[0]?.data);eyes=geometry.eyes;pose=geometry.pose;if(pose){if(this.smoothed)pose=Object.fromEntries(Object.entries(pose).map(([k,v])=>[k,.65*this.smoothed[k]+.35*v]));this.smoothed=pose;pose=Object.fromEntries(Object.entries(pose).map(([k,v])=>[k,Math.round(v*100)/100]));}}else this.smoothed=null;
  result.dispose();tensor.dispose();
  return {faces:landmarks.length,faceBoxes,pose,eyes,phones,quality,latencyMs:Math.round((performance.now()-processing)*100)/100,timestamp,source:'real_inference',model:'YOLO11n ONNX + MediaPipe Face Landmarker WASM',frameSize:[w,h],observationAgeMs:Math.round((performance.now()-started)*100)/100};
 }
 async close(){this.face?.close();await this.yolo?.release();this.face=null;this.yolo=null;}
}

