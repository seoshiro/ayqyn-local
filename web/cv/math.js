export function letterboxShape(width,height,target=640,stride=32){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<32||height<32||width>1920||height>1080)throw Error('Unsupported frame dimensions');
 const scale=Math.min(target/width,target/height),resizedWidth=Math.round(width*scale),resizedHeight=Math.round(height*scale);
 const padX=(target-resizedWidth)%stride,padY=(target-resizedHeight)%stride;
 return {width:resizedWidth+padX,height:resizedHeight+padY,resizedWidth,resizedHeight,left:Math.max(0,Math.round(padX/2-.1)),top:Math.max(0,Math.round(padY/2-.1)),scale};
}
export function imageTensor(rgba,width,height,shape){
 // Explicit pixel-centre bilinear interpolation, RGB/255, NCHW. Padding is 114.
 const plane=shape.width*shape.height,out=new Float32Array(plane*3);out.fill(114/255);
 for(let y=0;y<shape.resizedHeight;y++){const sy=Math.max(0,(y+.5)*height/shape.resizedHeight-.5),y0=Math.min(height-1,Math.floor(sy)),y1=Math.min(height-1,y0+1),dy=sy-y0;
  for(let x=0;x<shape.resizedWidth;x++){const sx=Math.max(0,(x+.5)*width/shape.resizedWidth-.5),x0=Math.min(width-1,Math.floor(sx)),x1=Math.min(width-1,x0+1),dx=sx-x0,index=(y+shape.top)*shape.width+x+shape.left;
   for(let c=0;c<3;c++){const a=rgba[(y0*width+x0)*4+c],b=rgba[(y0*width+x1)*4+c],d=rgba[(y1*width+x0)*4+c],e=rgba[(y1*width+x1)*4+c];out[c*plane+index]=Math.round((a*(1-dx)+b*dx)*(1-dy)+(d*(1-dx)+e*dx)*dy)/255;}
  }
 }
 return out;
}
export function iou(a,b){const inter=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1])),area=x=>Math.max(0,x[2]-x[0])*Math.max(0,x[3]-x[1]);return inter/Math.max(area(a)+area(b)-inter,1e-9);}
export function phonesFromTensor(data,dims,shape,width,height,confidence=.45,nms=.7){
 if(dims.length!==3||dims[0]!==1||dims[1]!==84||data.length!==84*dims[2])throw Error('Unexpected YOLO11 COCO output');const count=dims[2],candidates=[];
 for(let i=0;i<count;i++){let best=0,label=-1;for(let c=0;c<80;c++){const score=data[(4+c)*count+i];if(score>best){best=score;label=c;}}if(label!==67||best<confidence)continue;
  const cx=data[i],cy=data[count+i],w=data[2*count+i],h=data[3*count+i];const box=[cx-w/2,cy-h/2,cx+w/2,cy+h/2];if(box.every(Number.isFinite)&&w>0&&h>0)candidates.push({box,confidence:best,index:i});
 }
 candidates.sort((a,b)=>b.confidence-a.confidence||a.index-b.index);const kept=[];
 for(const p of candidates){if(kept.every(k=>iou(k.box,p.box)<=nms))kept.push(p);if(kept.length>=300)break;}
 return kept.map(p=>{const b=p.box.map((v,i)=>Math.max(0,Math.min(i%2?height:width,(v-(i%2?shape.top:shape.left))/shape.scale))),box=b.map((v,i)=>v/(i%2?height:width));return {box:box.map(v=>Math.round(v*10000)/10000),confidence:Math.round(p.confidence*1000)/1000,raised:(box[1]+box[3])/2<.55&&box[3]-box[1]>.12,rising:false,label:'cell phone'};});
}
export function frameQuality(rgba,width,height){
 const gray=new Float32Array(width*height);let sum=0;for(let i=0;i<gray.length;i++){const p=i*4;gray[i]=Math.round(.299*rgba[p]+.587*rgba[p+1]+.114*rgba[p+2]);sum+=gray[i];}
 let lap=0,lap2=0,count=0;for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x,v=gray[i-width]+gray[i+width]+gray[i-1]+gray[i+1]-4*gray[i];lap+=v;lap2+=v*v;count++;}
 const brightness=sum/gray.length,sharpness=count?lap2/count-(lap/count)**2:0,usable=brightness>=35&&brightness<=235&&sharpness>=12;
 return {usable,brightness:Math.round(brightness*10)/10,sharpness:Math.round(sharpness*10)/10,reason:usable?'ok':'low_light_or_blur'};
}
export function faceGeometry(landmarks,matrix){
 // Project onto each eye's own axes: division by screen y alone explodes
 // during blinks and roll. Unreliable iris geometry is unavailable, never zero.
 const ratio=(iris,left,right,top,bottom)=>{
  const points=[iris,left,right,top,bottom].map(i=>landmarks?.[i]);
  if(points.some(p=>!p||![p.x,p.y].every(Number.isFinite)))return null;
  const [p,a,b,c,d]=points,hx=b.x-a.x,hy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,width2=hx*hx+hy*hy,height2=vx*vx+vy*vy;
  // A conservative numerical guard; this is not a physical eye-closure classifier.
  if(width2<1e-12||height2<width2*.06**2)return null;
  const xy=[((p.x-a.x)*hx+(p.y-a.y)*hy)/width2,((p.x-c.x)*vx+(p.y-c.y)*vy)/height2];
  return xy.every(v=>Number.isFinite(v)&&v>=-2&&v<=3)?xy:null;
 };
 const l=ratio(468,33,133,159,145),r=ratio(473,362,263,386,374);
 const eyes=l&&r?{x:Math.round((l[0]+r[0])*500)/1000,y:Math.round((l[1]+r[1])*500)/1000,proxy:true}:null;let pose=null;
 if(matrix?.length===16&&Array.from(matrix).every(Number.isFinite)&&Math.hypot(matrix[6],matrix[10])>1e-9&&Math.hypot(matrix[1],matrix[0])>1e-9){const m=matrix,deg=180/Math.PI;pose={yaw:Math.asin(Math.max(-1,Math.min(1,-m[2])))*deg,pitch:Math.atan2(m[6],m[10])*deg,roll:Math.atan2(m[1],m[0])*deg};}
 return {pose,eyes};
}
