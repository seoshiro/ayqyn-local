"""Public output contains redacted fixture faces. Inference ran on source originals."""
import json
from pathlib import Path
import cv2
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'dist'/'fixtures'
replay=json.loads((out/'replay.json').read_text('utf-8'))
boxes={}
for row in replay['observations']:
 filename=Path(row['asset']).name
 if filename not in boxes:boxes[filename]=row['observation'].get('faceBoxes',[])
for filename,faces in boxes.items():
 file=out/filename;image=cv2.imread(str(file));h,w=image.shape[:2]
 for x1,y1,x2,y2 in faces:
  pad=.035;left=max(0,int((x1-pad)*w));right=min(w,int((x2+pad)*w));top=max(0,int((y1-pad)*h));bottom=min(h,int((y2+pad)*h))
  image[top:bottom,left:right]=(24,47,55)
 cv2.imwrite(str(file),image)
replay['provenance']['publicDisplay']='Face-redacted images; model observations computed on the original attributed photographs. No real student data.'
(out/'replay.json').write_text(json.dumps(replay,indent=2)+'\n','utf-8')
print('Public display faces redacted; original local fixtures retained.')
