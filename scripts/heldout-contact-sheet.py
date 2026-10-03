import json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];folder=ROOT/'evaluation'/'heldout';manifest=json.loads((folder/'manifest.json').read_text('utf-8'))
for start in [0,16]:
 sheet=Image.new('RGB',(1200,1040),'white');draw=ImageDraw.Draw(sheet)
 for i,item in enumerate(manifest['items'][start:start+16]):
  image=Image.open(folder/item['filename']).convert('RGB');image.thumbnail((292,212));x=(i%4)*300;y=(i//4)*260
  sheet.paste(image,(x+(300-image.width)//2,y));draw.text((x+5,y+218),f"{start+i}: {item['category']}",fill='black');draw.text((x+5,y+235),item['imageId'],fill='black')
 sheet.save(ROOT/'evidence'/f'heldout-contact-{start}.jpg')
