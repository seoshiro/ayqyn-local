/** Public replay: whitelist only; all fixture pixels replaced by synthetic diagrams. Node only. */
import fs from 'node:fs/promises';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';
const workspace=path.resolve('.'),root=path.join(workspace,'web'),out=path.join(workspace,'dist');
if(out!==path.join(workspace,'dist')||!out.startsWith(workspace+path.sep))throw Error('Unsafe build directory');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(path.join(out,'fixtures'),{recursive:true});
for(const file of ['index.html','app.js','core.js','schema.js','sensor.js','diagnostics.js','boot.js','style.css','favicon.svg'])await fs.copyFile(path.join(root,file),path.join(out,file));
const replay=JSON.parse(await fs.readFile(path.join(root,'fixtures/replay.json'),'utf8'));
if(replay.provenance.type!=='real_wasm_inference_repeated_stills')throw Error('Public build requires explicitly attributed current WASM replay');
const crc32=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function chunk(type,data){const t=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([size,t,data,crc]);}
function diagram(o){const w=640,h=480,p=Buffer.alloc(w*h*3),bg=[19,48,59];for(let i=0;i<p.length;i+=3)p.set(bg,i);const fill=(x,y,rw,rh,c)=>{for(let yy=Math.max(0,y|0);yy<Math.min(h,(y+rh)|0);yy++)for(let xx=Math.max(0,x|0);xx<Math.min(w,(x+rw)|0);xx++)p.set(c,(yy*w+xx)*3);};
 for(const box of o.faceBoxes||[]){const [a,b,c,d]=box,xx=a*w,yy=b*h,ww=(c-a)*w,hh=(d-b)*h;fill(xx-3,yy-3,ww+6,hh+6,[123,170,181]);fill(xx,yy,ww,hh,[31,71,82]);fill(xx+ww*.3,yy+hh*.24,ww*.4,hh*.42,[96,141,153]);}
 for(const phone of o.phones){const [a,b,c,d]=phone.box,xx=a*w,yy=b*h,ww=(c-a)*w,hh=(d-b)*h;fill(xx-4,yy-4,ww+8,hh+8,[153,216,192]);fill(xx,yy,ww,hh,[20,60,63]);fill(xx+5,yy+7,ww-10,hh-25,[71,130,125]);}
 if(!o.quality.usable)fill(0,h-18,w,18,[161,125,72]);const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++)p.copy(raw,y*(w*3+1)+1,y*w*3,(y+1)*w*3);const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const files=new Map();for(const row of replay.observations){const original=path.basename(row.asset),name=original.replace(/\.(jpg|png)$/,'-diagram.png');if(!files.has(name)){const bytes=diagram(row.observation);await fs.writeFile(path.join(out,'fixtures',name),bytes);files.set(name,{file:name,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),original});}row.asset='fixtures/'+name;}
replay.provenance.publicDisplay='Synthetic diagrams contain no original photograph pixels. Model observations were computed on attributed original test photographs. No student data. Diagrams are illustrations, not contextual evidence.';
await fs.writeFile(path.join(out,'fixtures/replay.json'),JSON.stringify(replay,null,2)+'\n');await fs.copyFile(path.join(root,'fixtures/attribution.json'),path.join(out,'fixtures/attribution.json'));
await fs.writeFile(path.join(out,'PUBLIC-BUILD.json'),JSON.stringify({schema:1,sourceCommit:process.env.GITHUB_SHA||'local-build',runtime:replay.provenance.runtime,rawFixturePixels:false,camera:false,localCV:false,files:[...files.values()]},null,2)+'\n');
console.log('Public replay built: whitelist, no CV/runtime assets, six synthetic diagrams, no original photograph pixels.');
