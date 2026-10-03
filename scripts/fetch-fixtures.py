"""Attributable public test photographs; no camera access."""
import urllib.request,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];folder=ROOT/'web'/'fixtures';folder.mkdir(parents=True,exist_ok=True)
assets=[('astronaut.png','https://raw.githubusercontent.com/scikit-image/scikit-image/v0.25.2/skimage/data/astronaut.png','NASA','Public domain','https://scikit-image.org/docs/stable/api/skimage.data.html#skimage.data.astronaut'),('phone-desk.jpg','https://upload.wikimedia.org/wikipedia/commons/b/bf/A_Guy_is_use_of_smart_phone_on_the_desk.jpg','Peachyeung316','CC-BY-SA-4.0','https://commons.wikimedia.org/wiki/File:A_Guy_is_use_of_smart_phone_on_the_desk.jpg')]
assets.extend([('phone-hand.jpg','https://upload.wikimedia.org/wikipedia/commons/c/cc/Black_smartphone_in_hand_%28Unsplash%29.jpg','Dennis Cortés','CC0-1.0','https://commons.wikimedia.org/wiki/File:Black_smartphone_in_hand_(Unsplash).jpg'),('phone-photo.jpg','https://upload.wikimedia.org/wikipedia/commons/b/bb/Smartphone_photographer_%28Unsplash%29.jpg','James Sutton','CC0-1.0','https://commons.wikimedia.org/wiki/File:Smartphone_photographer_(Unsplash).jpg')])
out=[]
for name,url,author,license,source in assets:
 file=folder/name
 if not file.exists():
  req=urllib.request.Request(url,headers={'User-Agent':'AYQYN/0.1 local prototype fixture research'})
  with urllib.request.urlopen(req,timeout=60) as res:data=res.read()
  if name.endswith('.jpg'):
   import cv2,numpy as np
   image=cv2.imdecode(np.frombuffer(data,np.uint8),cv2.IMREAD_COLOR);image=cv2.resize(image,(960,round(image.shape[0]*960/image.shape[1])));cv2.imwrite(str(file),image)
  else:file.write_bytes(data)
 out.append({'filename':name,'url':url,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'author':author,'license':license,'source':source,'modifications':'phone resized, EXIF stripped; astronaut unchanged','note':'Test photograph, no association with exams or misconduct; no endorsement.'})
(folder/'attribution.json').write_text(json.dumps(out,indent=2)+'\n','utf-8')
print(json.dumps(out,indent=2))
