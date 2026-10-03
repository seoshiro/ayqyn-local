"""Small smoke set, NOT general accuracy validation. All observations are real model output."""
import sys,json,base64,time,platform,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'cv'))
from worker import Detector
import cv2,numpy as np,psutil
folder=ROOT/'web'/'fixtures';evidence=ROOT/'evidence';evidence.mkdir(exist_ok=True)
photo=cv2.imread(str(folder/'astronaut.png'))
if photo is None:raise RuntimeError('Fetch fixtures first')
# Derived stress fixtures retain photograph pixels; they are explicitly labelled transformations.
head=cv2.resize(photo[25:215,145:315],(300,420))
pair=np.full((480,640,3),120,dtype=np.uint8);pair[30:450,10:310]=head;pair[30:450,330:630]=head
transforms={'two-faces':pair,'dark':(photo*.12).astype(np.uint8),'blur':cv2.GaussianBlur(photo,(41,41),20),'empty':np.tile(np.arange(512,dtype=np.uint8),(512,1))}
for name,image in transforms.items():cv2.imwrite(str(folder/(name+'.jpg')),image)
labels=[('astronaut.png',1,False,'original photograph'),('phone-desk.jpg',None,True,'original photograph resized'),('phone-hand.jpg',0,True,'original photograph resized'),('phone-photo.jpg',None,True,'original photograph resized'),('two-faces.jpg',2,False,'composite of two copies; derived test'),('dark.jpg',None,False,'photograph darkened; derived quality test'),('blur.jpg',None,False,'photograph blurred; derived quality test'),('empty.jpg',0,False,'synthetic ramp; sensor healthy absence test')]
start=time.perf_counter();detector=Detector();init=(time.perf_counter()-start)*1000
rows=[];t=0;latencies=[];peak=0;results=[]
for name,faces,phone,kind in labels:
 image=cv2.imread(str(folder/name));ok,encoded=cv2.imencode('.jpg',image)
 observations=[]
 for repeat in range(18):
  t+=200;out=detector.infer(base64.b64encode(encoded).decode(),t);latencies.append(out['latencyMs']);peak=max(peak,psutil.Process().memory_info().rss);rows.append({'at':t,'asset':'fixtures/'+name,'observation':out});observations.append(out)
 last=observations[-1];results.append({'fixture':name,'kind':kind,'sha256':hashlib.sha256((folder/name).read_bytes()).hexdigest(),'expectedFaces':faces,'observedFaces':last['faces'],'expectedPhone':phone,'observedPhone':bool(last['phones']),'phoneConfidence':[p['confidence'] for p in last['phones']],'qualityUsable':last['quality']['usable'],'pose':last['pose']})
 print(name,json.dumps(results[-1]),flush=True)
detector.face.close()
metrics={'note':'8-image smoke set, repeated 18 times each. Not exam video accuracy; frames are correlated. First frame is cold inference.','frames':len(rows),'p50Ms':round(float(np.percentile(latencies[1:],50)),2),'p95Ms':round(float(np.percentile(latencies[1:],95)),2),'coldInferenceMs':latencies[0],'initMs':round(init,2),'workerPeakRssMB':round(peak/1024**2,1),'platform':platform.platform(),'processor':platform.processor(),'logicalCpu':psutil.cpu_count(),'ramGB':round(psutil.virtual_memory().total/1024**3,1),'phonePhotoTP':sum(x['expectedPhone'] and x['observedPhone'] for x in results[:4]),'phonePhotoPositiveDenominator':3,'phonePhotoFP':sum(not x['expectedPhone'] and x['observedPhone'] for x in results[:4]),'phonePhotoNegativeDenominator':1,'fixtures':results}
(evidence/'cv-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n','utf-8')
(folder/'replay.json').write_text(json.dumps({'schema':1,'provenance':{'type':'real_inference_repeated_stills','models':json.loads((ROOT/'models'/'manifest.json').read_text()),'attribution':'fixtures/attribution.json','methodology':metrics['note']},'observations':rows},indent=2)+'\n','utf-8')
print(json.dumps({k:v for k,v in metrics.items() if k!='fixtures'},indent=2))
# A file-backed virtual camera for native E2E; never a physical device.
camera=cv2.resize(photo,(640,480));yuv=cv2.cvtColor(camera,cv2.COLOR_BGR2YUV_I420)
with (evidence/'virtual-camera.y4m').open('wb') as f:
 f.write(b'YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\n')
 for _ in range(400):f.write(b'FRAME\n');f.write(yuv.tobytes())
