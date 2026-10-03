import fs from 'node:fs/promises';import path from 'node:path';import packager from '@electron/packager';
const root=path.resolve('.'),input=path.join(root,'data','package-input-v02');await fs.mkdir(input,{recursive:true});
for(const name of ['desktop','web','LICENSE','docs'])await fs.cp(path.join(root,name),path.join(input,name),{recursive:true});
const pkg={name:'ayqyn-local',version:'0.2.0',description:'Local proctoring observations for human review',main:'desktop/main.cjs',type:'module',license:'AGPL-3.0-only'};await fs.writeFile(path.join(input,'package.json'),JSON.stringify(pkg,null,2));
const output=await packager({dir:input,name:'AYQYN',platform:'win32',arch:'x64',electronVersion:'44.5.1',out:path.join(root,'release'),overwrite:false,asar:false,prune:true,download:{cacheRoot:path.join(root,'data','electron-downloads')}});
for(const directory of output){const files=await fs.readdir(directory);if(!files.includes('AYQYN.exe'))throw Error('Executable missing');console.log(JSON.stringify({directory,pythonIncluded:false,models:'local official ONNX + FaceLandmarker task',runtime:'WASM'}));}

