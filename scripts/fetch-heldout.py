"""Pre-register a deterministic held-out photo set before model evaluation."""
import urllib.request,csv,io,json,hashlib,concurrent.futures
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];cache=ROOT/'data'/'openimages';cache.mkdir(parents=True,exist_ok=True)
folder=ROOT/'evaluation'/'heldout';folder.mkdir(parents=True,exist_ok=True)
urls={'classes':'https://storage.googleapis.com/openimages/v5/class-descriptions-boxable.csv','boxes':'https://storage.googleapis.com/openimages/v5/validation-annotations-bbox.csv','images':'https://storage.googleapis.com/openimages/2018_04/validation/validation-images-with-rotation.csv'}
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AYQYN local research/0.2'}),timeout=60) as r:return r.read()
for key,url in urls.items():
 file=cache/(key+'.csv')
 if not file.exists():file.write_bytes(fetch(url))
classes=dict(csv.reader((cache/'classes.csv').read_text().splitlines()))
names=['Mobile phone','Remote control','Book','Wallet','Calculator','Camera']
ids={n:next((k for k,v in classes.items() if v.lower()==n.lower()),None) for n in names}
print('classes',ids,flush=True)
allboxes=list(csv.DictReader((cache/'boxes.csv').open(newline='',encoding='utf-8')))
metadata={r['ImageID']:r for r in csv.DictReader((cache/'images.csv').open(newline='',encoding='utf-8'))}
phoneids={r['ImageID'] for r in allboxes if r['LabelName']==ids['Mobile phone']}
selection=[]
for name in names:
 label=ids[name]
 if not label:continue
 candidates=sorted({r['ImageID'] for r in allboxes if r['LabelName']==label and r['IsDepiction']=='0' and (name=='Mobile phone' or r['ImageID'] not in phoneids)})
 count=16 if name=='Mobile phone' else 4
 for imageid in candidates[:count]:
  meta=metadata[imageid]
  selection.append({'imageId':imageid,'filename':imageid+'.jpg','split':'validation','category':name,'expectedPhone':name=='Mobile phone','boxes':[{k:r[k] for k in ['LabelName','XMin','XMax','YMin','YMax','IsOccluded','IsTruncated']} for r in allboxes if r['ImageID']==imageid and r['LabelName']==ids['Mobile phone']], 'license':meta.get('License'),'author':meta.get('Author'),'title':meta.get('Title'),'landing':meta.get('OriginalLandingURL'),'originalURL':meta.get('OriginalURL'),'selection':'first sorted ImageIDs, non-depictions; negatives exclude annotated phone images; manual visual verification required'})
manifest={'schema':1,'purpose':'independent held-out image smoke evaluation; no test-driven tuning','selectionFrozenBeforeInference':True,'selectionCount':len(selection),'sources':urls,'method':'16 positive and up to 4 each negative class, first sorted annotation IDs. No model scores used in selection. Missing phone annotations do not establish negatives; manual review must approve labels.','items':selection}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n','utf-8')
def download(item):
 file=folder/item['filename'];url='https://open-images-dataset.s3.amazonaws.com/validation/'+item['filename']
 try:
  if not file.exists():file.write_bytes(fetch(url))
  item['sha256']=hashlib.sha256(file.read_bytes()).hexdigest();item['downloadURL']=url;item['bytes']=file.stat().st_size
 except Exception as e:item['downloadError']=str(e)
 return item
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:manifest['items']=list(pool.map(download,selection))
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n','utf-8')
print(json.dumps({'selected':len(selection),'downloaded':sum('sha256' in x for x in selection),'manifest':str(folder/'manifest.json')}))
