"""Explicit setup only. Runtime worker has no download path."""
import hashlib,json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
assets=[
 ('yolo11n.pt','https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.pt','AGPL-3.0','https://www.ultralytics.com/license','0ebbc80d4a7680d14987a577cd21342b65ecfd94632bd9a8da63ae6417644ee1'),
 ('face_landmarker.task','https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task','Apache-2.0','https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE','64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff')]
folder=ROOT/'models';folder.mkdir(exist_ok=True)
manifest={'schema':1,'assets':[],'note':'SHA256 pins the downloaded assets for offline verification. Review initial source provenance before setup.'}
for filename,url,license,source,expected in assets:
 file=folder/filename
 if not file.exists():
  with urllib.request.urlopen(url,timeout=60) as response:file.write_bytes(response.read())
 digest=hashlib.sha256(file.read_bytes()).hexdigest()
 if digest!=expected:raise RuntimeError('SHA256 mismatch: '+filename)
 manifest['assets'].append({'filename':filename,'url':url,'sha256':digest,'bytes':file.stat().st_size,'license':license,'licenseSource':source})
 print(filename,digest,file.stat().st_size)
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n','utf-8')
