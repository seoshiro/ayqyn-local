import subprocess,zipfile,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];folder=ROOT/'artifacts';folder.mkdir(exist_ok=True)
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
files=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
archive=folder/'AYQYN-first-working-slice.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for name in files:
  if name and (ROOT/name).is_file():z.write(ROOT/name,'ayqyn/'+name)
 for name in ['models/yolo11n.pt','models/face_landmarker.task']:
  z.write(ROOT/name,'ayqyn/'+name)
 videos=list((ROOT/'evidence').glob('*.webm'))
 if videos:z.write(max(videos,key=lambda f:f.stat().st_size),'ayqyn/evidence/browser-walkthrough.webm')
 z.writestr('ayqyn/SOURCE_COMMIT.txt',commit+'\n')
with zipfile.ZipFile(archive) as z:
 if z.testzip():raise RuntimeError('Archive corruption')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'sourceCommit':commit}))
