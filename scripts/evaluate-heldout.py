import os,json,time,hashlib,argparse
args=argparse.ArgumentParser();args.add_argument("--model",default="yolo11n.pt");args.add_argument("--output",default="heldout-metrics.json");args=args.parse_args()
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];os.environ['YOLO_OFFLINE']='true';os.environ['YOLO_CONFIG_DIR']=str(ROOT/'data'/'yolo');os.environ['MPLCONFIGDIR']=str(ROOT/'data'/'matplotlib')
import cv2,numpy as np
from ultralytics import YOLO
folder=ROOT/'evaluation'/'heldout';manifest=json.loads((folder/'manifest.json').read_text());review=json.loads((ROOT/'evaluation'/'manual-review.json').read_text())
reviewmap={x['imageId']:x for x in review['items']}
def iou(a,b):
 inter=max(0,min(a[2],b[2])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[1],b[1]))
 area=lambda x:max(0,x[2]-x[0])*max(0,x[3]-x[1])
 return inter/max(area(a)+area(b)-inter,1e-9)
summaries=[];records=[]
for size in ([640,960] if args.model=='yolo11n.pt' else [640]):
 model=YOLO(str(ROOT/'models'/args.model));latency=[]
 for item in manifest['items']:
  frame=cv2.imread(str(folder/item['filename']));h,w=frame.shape[:2]
  if hashlib.sha256((folder/item['filename']).read_bytes()).hexdigest()!=item['sha256']:raise RuntimeError('Fixture changed')
  start=time.perf_counter();r=model.predict(frame,classes=[67],imgsz=size,conf=.45,iou=.7,device='cpu',verbose=False)[0];elapsed=(time.perf_counter()-start)*1000;latency.append(elapsed)
  boxes=[{'box':[float(x)/[w,h,w,h][i] for i,x in enumerate(b.xyxy[0].tolist())],'confidence':round(float(b.conf[0]),4)} for b in r.boxes]
  truth=[[float(b[k]) for k in ['XMin','YMin','XMax','YMax']] for b in item['boxes']]
  match=any(iou(b['box'],t)>=.3 for b in boxes for t in truth)
  manual=reviewmap.get(item['imageId'],{'verifiedPhone':False,'kind':'photograph_negative'})
  row={'imageId':item['imageId'],'category':item['category'],'imgsz':size,'datasetPositive':item['expectedPhone'],'verifiedPhone':manual['verifiedPhone'],'kind':manual['kind'],'foundPhone':bool(boxes),'localizedPhone':match,'detections':boxes,'latencyMs':round(elapsed,2),'sha256':item['sha256']};records.append(row)
  print(size,item['imageId'],item['category'],bool(boxes),match,flush=True)
 rows=[x for x in records if x['imgsz']==size];photo=[x for x in rows if x['kind']=='photograph' and x['verifiedPhone'] is True];neg=[x for x in rows if x['verifiedPhone'] is False]
 summaries.append({'imgsz':size,'confidence':.45,'datasetPositiveTP':sum(x['datasetPositive'] and x['localizedPhone'] for x in rows),'datasetPositiveDenominator':16,'verifiedPhotoTP':sum(x['foundPhone'] for x in photo),'verifiedPhotoPositiveDenominator':len(photo),'negativeFP':sum(x['foundPhone'] for x in neg),'negativeDenominator':len(neg),'p50Ms':round(float(np.percentile(latency[1:],50)),2),'p95Ms':round(float(np.percentile(latency[1:],95)),2)})
(ROOT/'evidence'/args.output).write_text(json.dumps({'schema':1,'model':args.model,'modelSHA256':hashlib.sha256((ROOT/'models'/args.model).read_bytes()).hexdigest(),'protocol':json.loads((ROOT/'evaluation'/'protocol.json').read_text()),'review':review,'note':'32 preselected independent Open Images scenes. No threshold retuning. Dataset-label and physically verified photo metrics differ. Not exam-video accuracy; manual review by Codex, not independent human.','summaries':summaries,'records':records},indent=2)+'\n','utf-8')
print(json.dumps(summaries,indent=2))
