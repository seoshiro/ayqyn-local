"""Local inference worker. Never opens a camera or downloads models at runtime."""
import os
os.environ['YOLO_OFFLINE'] = 'true'
os.environ['YOLO_AUTOINSTALL'] = 'false'
os.environ['YOLO_CONFIG_DIR'] = os.path.join(os.environ.get('AYQYN_RUNTIME_DATA',os.path.join(os.path.dirname(__file__),'..','data')), 'yolo')
import sys, json, base64, time, hashlib, contextlib
from pathlib import Path

ROOT = Path(os.environ.get('AYQYN_ASSET_DIR',Path(__file__).resolve().parents[1]))
os.environ['MPLCONFIGDIR']=str(Path(os.environ.get('AYQYN_RUNTIME_DATA',ROOT/'data'))/'matplotlib')
Path(os.environ['YOLO_CONFIG_DIR']).mkdir(parents=True,exist_ok=True)
Path(os.environ['MPLCONFIGDIR']).mkdir(parents=True,exist_ok=True)

class Detector:
    def __init__(self):
        with contextlib.redirect_stdout(sys.stderr):
            import cv2, numpy as np, mediapipe as mp
            from ultralytics import YOLO
            self.cv2, self.np, self.mp = cv2, np, mp
            manifest = json.loads((ROOT/'models'/'manifest.json').read_text('utf-8'))
            for item in manifest['assets']:
                file = ROOT/'models'/item['filename']
                if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest()!=item['sha256']:
                    raise RuntimeError('Model missing or SHA256 mismatch: '+item['filename'])
            self.model = YOLO(str(ROOT/'models'/'yolo11n.pt'))
            ids = [int(k) for k,v in self.model.names.items() if v == 'cell phone']
            if len(ids)!=1: raise RuntimeError('Phone class missing from model metadata')
            self.phone_class = ids[0]
            options = mp.tasks.vision.FaceLandmarkerOptions(
                base_options=mp.tasks.BaseOptions(model_asset_path=str(ROOT/'models'/'face_landmarker.task')),
                running_mode=mp.tasks.vision.RunningMode.VIDEO, num_faces=2,
                output_face_blendshapes=False,output_facial_transformation_matrixes=False,
                min_face_detection_confidence=.5,min_face_presence_confidence=.5,min_tracking_confidence=.5)
            self.face = mp.tasks.vision.FaceLandmarker.create_from_options(options)
        self.last_timestamp=-1
        self.previous_phone=None
        self.smoothed=None

    def infer(self, encoded, timestamp):
        cv2,np,mp=self.cv2,self.np,self.mp
        if not isinstance(timestamp,int) or timestamp<=self.last_timestamp: raise ValueError('Nonmonotonic timestamp')
        self.last_timestamp=timestamp
        if not isinstance(encoded,str) or len(encoded)>2_000_000: raise ValueError('Frame too large')
        data=base64.b64decode(encoded,validate=True)
        frame=cv2.imdecode(np.frombuffer(data,dtype=np.uint8),cv2.IMREAD_COLOR)
        if frame is None: raise ValueError('Invalid image')
        h,w=frame.shape[:2]
        if h>1080 or w>1920 or min(h,w)<32: raise ValueError('Unsupported image dimensions')
        start=time.perf_counter()
        gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
        brightness=float(gray.mean()); sharpness=float(cv2.Laplacian(gray,cv2.CV_64F).var())
        exposure=brightness>=35 and brightness<=235
        # Focus is a coarse quality indicator, not a face classifier.
        quality={'usable':exposure and sharpness>=12,'brightness':round(brightness,1),'sharpness':round(sharpness,1),'reason':'ok' if exposure and sharpness>=12 else 'low_light_or_blur'}
        with contextlib.redirect_stdout(sys.stderr):
            detections=self.model.predict(frame,classes=[self.phone_class],conf=.45,imgsz=640,device='cpu',verbose=False)[0]
            rgb=cv2.cvtColor(frame,cv2.COLOR_BGR2RGB)
            faces=self.face.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb),timestamp)
        phones=[]
        for b in detections.boxes:
            x1,y1,x2,y2=[float(v) for v in b.xyxy[0].tolist()]
            center=(y1+y2)/2/h; prev=self.previous_phone
            raised=center<.55 and (y2-y1)/h>.12
            rising=prev is not None and timestamp-prev[1]<1500 and prev[0]-center>.10
            phones.append({'box':[round(x1/w,4),round(y1/h,4),round(x2/w,4),round(y2/h,4)],'confidence':round(float(b.conf[0]),3),'raised':raised,'rising':rising,'label':'cell phone'})
        if phones:self.previous_phone=((phones[0]['box'][1]+phones[0]['box'][3])/2,timestamp)
        else:self.previous_phone=None
        pose=None;eyes=None;face_boxes=[]
        for landmarks in faces.face_landmarks:
            xs=[p.x for p in landmarks];ys=[p.y for p in landmarks]
            face_boxes.append([min(xs),min(ys),max(xs),max(ys)])
        if len(faces.face_landmarks)==1:
            lm=faces.face_landmarks[0]
            area=(max(p.x for p in lm)-min(p.x for p in lm))*(max(p.y for p in lm)-min(p.y for p in lm))
            if area<.035:quality.update(usable=False,reason='face_too_small')
            # Generic 3D head geometry; estimate is a calibrated proxy, not gaze truth.
            model=np.array([(0,0,0),(0,-330,-65),(-225,170,-135),(225,170,-135),(-150,-150,-125),(150,-150,-125)],dtype=np.float64)
            points=np.array([(lm[i].x*w,lm[i].y*h) for i in [1,152,33,263,61,291]],dtype=np.float64)
            camera=np.array([[w,0,w/2],[0,w,h/2],[0,0,1]],dtype=np.float64)
            ok,rotation,_=cv2.solvePnP(model,points,camera,np.zeros((4,1)),flags=cv2.SOLVEPNP_ITERATIVE)
            if ok:
                matrix,_=cv2.Rodrigues(rotation)
                angles=cv2.RQDecomp3x3(matrix)[0]
                # Fold pitch at +/-180 to support image-coordinate head geometry.
                pitch=float(angles[0]);pitch=pitch-180 if pitch>90 else pitch+180 if pitch<-90 else pitch
                current={'pitch':-pitch,'yaw':float(angles[1]),'roll':float(angles[2])}
                if self.smoothed:
                    current={k:.65*self.smoothed[k]+.35*v for k,v in current.items()}
                self.smoothed=current;pose={k:round(v,2) for k,v in current.items()}
            def ratio(iris,left,right,top,bottom):
                a,b=lm[left],lm[right];c,d=lm[top],lm[bottom];p=lm[iris]
                dx=b.x-a.x;dy=d.y-c.y
                return ((p.x-a.x)/dx if abs(dx)>.001 else .5,(p.y-c.y)/dy if abs(dy)>.001 else .5)
            l=ratio(468,33,133,159,145);r=ratio(473,362,263,386,374)
            eyes={'x':round((l[0]+r[0])/2,3),'y':round((l[1]+r[1])/2,3),'proxy':True}
        else:self.smoothed=None
        return {'faces':len(faces.face_landmarks),'faceBoxes':face_boxes,'pose':pose,'eyes':eyes,'phones':phones,'quality':quality,'latencyMs':round((time.perf_counter()-start)*1000,2),'timestamp':timestamp,'source':'real_inference','model':'YOLO11n + MediaPipe Face Landmarker'}

def main():
    detector=None
    for line in sys.stdin:
        rid=None
        try:
            if len(line)>2_100_000:raise ValueError('Request too large')
            req=json.loads(line);rid=req.get('id');op=req.get('op')
            if op=='health':result={'ready':detector is not None,'cameraAccess':False}
            elif op=='init':
                if detector is None:detector=Detector()
                result={'ready':True,'phoneClass':detector.phone_class}
            elif op=='infer':
                if detector is None:raise RuntimeError('Detector not initialized')
                result=detector.infer(req['frame'],req['timestamp'])
            elif op=='stop':
                if detector:detector.face.close()
                print(json.dumps({'id':rid,'ok':True,'result':{'stopped':True}}),flush=True);break
            else:raise ValueError('Unsupported operation')
            print(json.dumps({'id':rid,'ok':True,'result':result}),flush=True)
        except Exception as e:
            print(json.dumps({'id':rid,'ok':False,'error':str(e)[:250]}),flush=True)

if __name__=='__main__':main()
