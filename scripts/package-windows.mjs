import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import packager from '@electron/packager';
const root=path.resolve('.'),git=(...args)=>execFileSync('git',['-c','safe.directory='+root,...args],{cwd:root,encoding:'utf8'}).trim();
const sourceCommit=git('rev-parse','HEAD');if(!/^[0-9a-f]{40}$/.test(sourceCommit)||git('status','--porcelain'))throw Error('Commit all intended source/evidence before packaging; working tree must be clean');
const sourcePackage=JSON.parse(git('show','HEAD:package.json'));
const manifestBytes=execFileSync('git',['-c','safe.directory='+root,'show','HEAD:web/runtime-manifest.json'],{cwd:root}),manifest=JSON.parse(manifestBytes);
for(const a of manifest.assets){const bytes=await fs.readFile(path.join('web',a.path));if(bytes.length!==a.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('Unverified runtime asset: '+a.path);}
const input=path.join(root,'data','package-input-'+sourceCommit.slice(0,7)+'-'+Date.now());await fs.mkdir(input,{recursive:true});
const sourceFiles=[];
for(const file of git('ls-tree','-r','--name-only',sourceCommit,'--','desktop','web','docs','licenses','LICENSE','README.md').split('\n').filter(Boolean)){
 if(file.includes('..')||! /^(?:desktop\/|web\/|docs\/|licenses\/|LICENSE$|README\.md$)/.test(file))throw Error('Unsafe source path');
 const destination=path.resolve(input,file);if(!destination.startsWith(input+path.sep))throw Error('Source path escaped');
 const bytes=execFileSync('git',['-c','safe.directory='+root,'show',sourceCommit+':'+file],{cwd:root,maxBuffer:10_000_000});await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,bytes);sourceFiles.push({path:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const asset of manifest.assets){const destination=path.join(input,'web',asset.path);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.copyFile(path.join(root,'web',asset.path),destination);}
await fs.writeFile(path.join(input,'SOURCE-FILES.json'),JSON.stringify({schema:1,sourceCommit,files:sourceFiles},null,2)+'\n');
const buildInfo={schema:1,version:sourcePackage.version,sourceCommit,packagedAt:new Date().toISOString(),runtimeManifestSha256:crypto.createHash('sha256').update(manifestBytes).digest('hex'),runtimeAssetCount:manifest.assets.length,runtimeAssetBytes:manifest.assets.reduce((n,a)=>n+a.bytes,0),runtime:'Official local ONNX Runtime Web and Google MediaPipe WASM; no Python',signed:false};
await fs.writeFile(path.join(input,'web','build-info.json'),JSON.stringify(buildInfo,null,2)+'\n');
execFileSync('git',['-c','safe.directory='+root,'archive','--format=zip','--output='+path.join(input,'CORRESPONDING-SOURCE.zip'),sourceCommit],{cwd:root});
const pkg={name:'ayqyn-local',version:sourcePackage.version,description:'Local proctoring observations for human review',main:'desktop/main.cjs',type:'module',license:'AGPL-3.0-only'};await fs.writeFile(path.join(input,'package.json'),JSON.stringify(pkg,null,2));
async function walk(directory){const result=[];for(const item of await fs.readdir(directory,{withFileTypes:true})){const file=path.join(directory,item.name);if(item.isSymbolicLink())throw Error('Unexpected packaged symlink');if(item.isDirectory())result.push(...await walk(file));else result.push(file);}return result;}
if((await walk(input)).some(p=>/\.(?:py|pyd)$/i.test(p)||/[\\/]\.venv/.test(p)))throw Error('Python/native Python extension in production inputs');
const release=path.join(root,'release'),previous=path.join(release,'AYQYN-win32-x64'),archived=path.join(release,'archive','AYQYN-before-'+sourceCommit.slice(0,7));
if((await fs.stat(previous).catch(()=>null))?.isDirectory()){if(!previous.startsWith(release+path.sep)||!archived.startsWith(release+path.sep)||await fs.stat(archived).catch(()=>null))throw Error('Unsafe/occupied archive path');await fs.mkdir(path.dirname(archived),{recursive:true});await fs.rename(previous,archived);}
const output=await packager({dir:input,name:'AYQYN',platform:'win32',arch:'x64',electronVersion:'44.5.1',out:release,overwrite:false,asar:false,prune:true,download:{cacheRoot:path.join(root,'data','electron-downloads')}});
for(const directory of output){const files=await walk(directory);if(!files.includes(path.join(directory,'AYQYN.exe'))||files.some(p=>/\.(?:py|pyd)$/i.test(p)))throw Error('Invalid release content');const executable=await fs.readFile(path.join(directory,'AYQYN.exe'));const record={...buildInfo,executableSha256:crypto.createHash('sha256').update(executable).digest('hex'),files:files.length,pythonFiles:0};await fs.writeFile(path.join(directory,'BUILD-INFO.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record));}
