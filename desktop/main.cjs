const {app,BrowserWindow,ipcMain,protocol,net,session}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {SessionStore}=require('./store.cjs'),ROOT=path.resolve(__dirname,'..');
if(process.env.AYQYN_TEST==='1'){
 const testData=process.env.AYQYN_DATA_DIR||path.join(ROOT,'data','electron-test');
 app.setPath('userData',testData);app.setPath('sessionData',testData);
 app.disableHardwareAcceleration();
 app.commandLine.appendSwitch('use-fake-device-for-media-stream');
 if(process.env.AYQYN_TEST_VIDEO)app.commandLine.appendSwitch('use-file-for-fake-video-capture',process.env.AYQYN_TEST_VIDEO);
}
protocol.registerSchemesAsPrivileged([{scheme:'ayqyn',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let win,worker,seq=0,active=false,cameraConsent=false,inFlight=false,lastObservation=0,lastTimestamp=-1;
const pending=new Map();
if(process.env.AYQYN_TEST==='1')app.on('ayqyn-test-crash-worker',()=>worker?.destroy());
function localOrigin(value){try{const url=new URL(value);return url.protocol==='ayqyn:'&&url.host==='local';}catch{return false;}}
function trusted(e){if(e.sender!==win?.webContents||e.senderFrame!==win.webContents.mainFrame||!localOrigin(e.senderFrame.url))throw Error('Untrusted sender');}
let hostEpoch=0,hostStarting=null,initPending=null,initialized=null;
function stop(){
 hostEpoch++;hostReady=null;hostStarting=null;initPending=null;initialized=null;
 cameraConsent=false;active=false;lastObservation=0;lastTimestamp=-1;
 if(win&&!win.isDestroyed()){win.setKiosk(false);win.setFullScreen(false);}
 const owned=worker;worker=null;if(owned&&!owned.isDestroyed()){owned.ayqynReject?.(Error('CV start cancelled'));owned.destroy();}
 for(const p of pending.values())p.reject(Error('Worker stopped'));pending.clear();inFlight=false;
}
function failure(e){stop();win?.webContents.send('sensor-error','Наблюдение остановлено: '+e.message);}
async function verifyRuntime(){
 const manifest=JSON.parse(await fs.readFile(path.join(ROOT,'web','runtime-manifest.json'),'utf8'));
 if(manifest.schema!==1||!Array.isArray(manifest.assets)||manifest.assets.length>30)throw Error('Invalid runtime manifest');
 for(const asset of manifest.assets){if(!/^runtime\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/.test(asset.path)||asset.path.includes('..')||!/^[0-9a-f]{64}$/.test(asset.sha256))throw Error('Invalid asset path');const bytes=await fs.readFile(path.join(ROOT,'web',asset.path));if(bytes.length!==asset.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Offline asset missing or hash mismatch: '+asset.path);}
 return manifest;
}
function serveLocal(req){const u=new URL(req.url);if(u.host!=='local')return new Response('Forbidden',{status:403});const relative=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);const file=path.resolve(ROOT,'web','.'+relative);if(!file.startsWith(path.join(ROOT,'web')+path.sep))return new Response('Forbidden',{status:403});return net.fetch(pathToFileURL(file).toString());}
let hostReady=null;
async function ensureHost(){
 if(worker&&!worker.isDestroyed())return hostReady;
 if(hostStarting)return hostStarting;
 const starting=createHost();hostStarting=starting;
 try{return await starting;}finally{if(hostStarting===starting)hostStarting=null;}
}
async function createHost(){
 const epoch=hostEpoch;await verifyRuntime();if(epoch!==hostEpoch)throw Error('CV start cancelled');
 const owned=worker=new BrowserWindow({show:false,webPreferences:{preload:path.join(__dirname,'cv-preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,partition:'ayqyn-cv-'+Date.now(),devTools:process.env.AYQYN_TEST==='1'}});
 owned.webContents.session.protocol.handle('ayqyn',serveLocal);
 owned.webContents.session.setPermissionRequestHandler((_wc,_p,callback)=>callback(false));owned.webContents.session.setPermissionCheckHandler(()=>false);
 owned.webContents.session.webRequest.onBeforeRequest({urls:['*://*/*']},(details,callback)=>callback({cancel:!details.url.startsWith('ayqyn://local/')}));
 owned.webContents.setWindowOpenHandler(()=>({action:'deny'}));owned.webContents.on('will-navigate',e=>e.preventDefault());owned.webContents.on('will-attach-webview',e=>e.preventDefault());
 owned.webContents.on('render-process-gone',()=>{if(worker===owned)failure(Error('Isolated CV renderer exited'));});owned.on('closed',()=>{if(worker===owned)failure(Error('CV host closed'));});
 hostReady=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{reject(Error('CV host readiness timeout'));if(worker===owned)failure(Error('CV host readiness timeout'));},15000);owned.ayqynReady=()=>{clearTimeout(timer);resolve();};owned.ayqynReject=e=>{clearTimeout(timer);reject(e);};});
 owned.loadURL('ayqyn://local/cv-host.html').catch(e=>{owned.ayqynReject(e);if(worker===owned)failure(e);});
 return hostReady;
}
async function request(op,payload={}){
 const epoch=hostEpoch;await ensureHost();if(epoch!==hostEpoch||!worker||worker.isDestroyed())throw Error('CV request cancelled');
 return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>failure(Error(op==='init'?'Model initialization timeout':'CV response timeout')),op==='init'?45000:6000);pending.set(id,{resolve:r=>{clearTimeout(t);resolve(r);},reject:e=>{clearTimeout(t);reject(e);}});worker.webContents.send('cv-request',{id,op,...payload});});
}
ipcMain.on('cv-ready',e=>{if(e.sender===worker?.webContents&&e.senderFrame===worker.webContents.mainFrame&&e.senderFrame.url==='ayqyn://local/cv-host.html')worker.ayqynReady?.();});
ipcMain.on('cv-response',(e,r)=>{if(e.sender!==worker?.webContents||e.senderFrame!==worker.webContents.mainFrame||e.senderFrame.url!=='ayqyn://local/cv-host.html'||!r||!Number.isSafeInteger(r.id))return;const p=pending.get(r.id);if(p){pending.delete(r.id);r.ok?p.resolve(r.result):p.reject(Error(String(r.error).slice(0,300)));}});
app.whenReady().then(async()=>{
 const {validateSession,expire}=await import(pathToFileURL(path.join(ROOT,'web','core.js')).href);
 const {observationSchema}=await import(pathToFileURL(path.join(ROOT,'web','schema.js')).href);
 const store=new SessionStore(process.env.AYQYN_DATA_DIR||path.join(app.getPath('userData'),'sessions'),validateSession,expire);await store.initialize();
 protocol.handle('ayqyn',serveLocal);
 win=new BrowserWindow({width:1420,height:940,minWidth:800,minHeight:650,title:'AYQYN — Local',backgroundColor:'#f3f6f7',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,devTools:process.env.AYQYN_TEST==='1'}});
 session.defaultSession.setPermissionCheckHandler((wc,permission,origin,details)=>wc===win.webContents&&localOrigin(origin)&&permission==='media'&&cameraConsent&&(!details.mediaType||details.mediaType==='video'));
 session.defaultSession.setPermissionRequestHandler((wc,permission,callback,details)=>callback(wc===win.webContents&&permission==='media'&&cameraConsent&&details.mediaTypes?.length>0&&details.mediaTypes.every(t=>t==='video')));
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.on('will-attach-webview',e=>e.preventDefault());
 win.webContents.on('before-input-event',(event,input)=>{
  if(input.type!=='keyDown')return;
  if(input.control&&input.shift&&input.key.toLowerCase()==='escape'){event.preventDefault();stop();win.webContents.send('emergency');return;}
  if(active&&(input.control||input.meta)&&['c','v','x','t','n','r','l','p','w'].includes(input.key.toLowerCase())){event.preventDefault();win.webContents.send('guard-event',['c','v','x'].includes(input.key.toLowerCase())?'clipboard':'navigation');}
 });
 win.on('blur',()=>{if(active)win.webContents.send('guard-event','focus');});win.on('closed',()=>{win=null;stop();});
 const handle=(name,fn)=>ipcMain.handle(name,(e,...args)=>{trusted(e);return fn(...args);});
 handle('capabilities',()=>({desktop:true,platform:process.platform,testSource:process.env.AYQYN_TEST==='1'?'virtual_camera':null,appBlocked:['copy','paste','navigation','new_window'],observed:['window_blur'],unsupported:['Alt+Tab','Win','PrtScn','other_processes'],managedWindows:'not_configured'}));
 handle('init',async()=>{
  if(initialized)return initialized;if(initPending)return initPending;
  const epoch=hostEpoch,starting=request('init').then(result=>{if(epoch!==hostEpoch)throw Error('CV initialization cancelled');if(result?.ready!==true)throw Error('CV did not initialize');initialized=result;return result;});initPending=starting;
  try{return await starting;}finally{if(initPending===starting)initPending=null;}
 });
 handle('consent',value=>{if(typeof value!=='boolean')throw Error('Explicit consent required');if(!value){stop();return false;}cameraConsent=true;return true;});
 handle('infer',async(frame,timestamp)=>{
  if(!cameraConsent)throw Error('Consent required');if(!initialized||!worker||worker.isDestroyed())throw Error('CV initialization required');if(inFlight)return {dropped:true};
  if(typeof frame!=='string'||frame.length>2_000_000||!Number.isSafeInteger(timestamp)||timestamp<=lastTimestamp)throw Error('Invalid frame');
  lastTimestamp=timestamp;inFlight=true;const owned=worker;
  try{const result=observationSchema(await request('infer',{frame,timestamp}));if(cameraConsent&&owned===worker)lastObservation=Date.now();return result;}finally{if(owned===worker)inFlight=false;}
 });
 handle('exam',({enabled,fullscreen=false}={})=>{if(typeof enabled!=='boolean'||typeof fullscreen!=='boolean')throw Error('Invalid mode');if(enabled&&(!cameraConsent||Date.now()-lastObservation>1500||!worker))throw Error('Свежие наблюдения и согласие обязательны');active=enabled;win.setFullScreen(enabled&&fullscreen);return {active};});
 handle('stop',()=>{stop();return true;});
 handle('save',s=>store.save(s));handle('load',()=>store.load());handle('delete',()=>store.delete());
 await win.loadURL('ayqyn://local/index.html');
}).catch(e=>{process.stderr.write('AYQYN startup failed: '+e.message+'\n');app.quit();});
app.on('window-all-closed',()=>{stop();app.quit();});app.on('before-quit',stop);

