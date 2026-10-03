"""Development diagnostics; never tune on the held-out evaluation split."""
import os,sys,json,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.environ['YOLO_OFFLINE']='true';os.environ['YOLO_CONFIG_DIR']=str(ROOT/'data'/'yolo');os.environ['MPLCONFIGDIR']=str(ROOT/'data'/'matplotlib')
import cv2,numpy as np
from ultralytics import YOLO
from ultralytics.data.augment import LetterBox
m=YOLO(str(ROOT/'models'/'yolo11n.pt'));out=[]
for name in ['phone-desk.jpg','phone-hand.jpg','phone-photo.jpg','astronaut.png']:
 frame=cv2.imread(str(ROOT/'web'/'fixtures'/name));h,w=frame.shape[:2]
 for size in [640,960]:
  start=time.perf_counter();r=m.predict(frame,imgsz=size,classes=None,conf=.05,iou=.7,device='cpu',verbose=False)[0]
  boxes=[{'class':m.names[int(b.cls[0])],'score':round(float(b.conf[0]),4),'xyxy':[round(float(x),1) for x in b.xyxy[0]]} for b in r.boxes]
  phone=[b for b in boxes if b['class']=='cell phone']
  cls=m.predict(frame,imgsz=size,classes=[67],conf=.05,iou=.7,device='cpu',verbose=False)[0]
  mapping=LetterBox(new_shape=(size,size),auto=False,stride=32)(image=frame)
  result={'fixture':name,'dimensions':[w,h],'imgsz':size,'letterboxDimensions':list(mapping.shape[:2]),'aspectPreserved':True,'phoneAllClasses':phone,'phoneFiltered':[round(float(b.conf[0]),4) for b in cls.boxes],'allClasses':boxes,'elapsedMs':round((time.perf_counter()-start)*1000,2)}
  out.append(result);print(name,size,json.dumps(result),flush=True)
(ROOT/'evidence'/'pipeline-audit.json').write_text(json.dumps({'phoneLabel':m.names[67],'exportParity':'Not applicable: .pt inference only, no exported model in production.','records':out},indent=2),'utf-8')
