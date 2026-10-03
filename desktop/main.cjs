const {app,BrowserWindow,ipcMain,protocol,net,session}=require('electron');
const path=require('node:path'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url'),readline=require('node:readline');
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
if(process.env.AYQYN_TEST==='1')app.on('ayqyn-test-crash-worker',()=>worker?.kill());
function localOrigin(value){try{const url=new URL(value);return url.protocol==='ayqyn:'&&url.host==='local';}catch{return false;}}
function trusted(e){if(e.sender!==win?.webContents||e.senderFrame!==win.webContents.mainFrame||!localOrigin(e.senderFrame.url))throw Error('Untrusted sender');}
function stop(){
 cameraConsent=false;active=false;lastObservation=0;lastTimestamp=-1;
 if(win&&!win.isDestroyed()){win.setKiosk(false);win.setFullScreen(false);}
 const owned=worker;worker=null;if(owned)owned.kill();
 for(const p of pending.values())p.reject(Error('Worker stopped'));pending.clear();inFlight=false;
}
function failure(e){stop();win?.webContents.send('sensor-error','Наблюдение остановлено: '+e.message);}
function request(op,payload={}){
 if(!worker){
  const executable=app.isPackaged?path.join(process.resourcesPath,'cv-runtime','ayqyn-cv.exe'):process.env.AYQYN_PYTHON||path.join(ROOT,'.venv',process.platform==='win32'?'Scripts':'bin',process.platform==='win32'?'python.exe':'python');
  const args=app.isPackaged?[]:[path.join(ROOT,'cv','worker.py')];
  const owned=worker=spawn(executable,args,{cwd:ROOT,stdio:['pipe','pipe','pipe'],windowsHide:true,shell:false,env:{...process.env,AYQYN_ASSET_DIR:ROOT,AYQYN_RUNTIME_DATA:path.join(app.getPath('userData'),'cv-cache')}});
  const lines=readline.createInterface({input:owned.stdout});
  lines.on('line',line=>{if(worker!==owned)return;try{const r=JSON.parse(line),p=pending.get(r.id);if(p){pending.delete(r.id);r.ok?p.resolve(r.result):p.reject(Error(r.error));}}catch{}});
  owned.stderr.on('data',()=>{});owned.on('error',e=>{if(worker===owned)failure(e);});owned.on('exit',()=>{if(worker===owned)failure(Error('CV worker exited'));});
 }
 return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>failure(Error(op==='init'?'Model initialization timeout':'CV response timeout')),op==='init'?45000:4000);pending.set(id,{resolve:r=>{clearTimeout(t);resolve(r);},reject:e=>{clearTimeout(t);reject(e);}});worker.stdin.write(JSON.stringify({id,op,...payload})+'\n',e=>{if(e)failure(e);});});
}
app.whenReady().then(async()=>{
 const {validateSession,expire}=await import(pathToFileURL(path.join(ROOT,'web','core.js')).href);
 const store=new SessionStore(process.env.AYQYN_DATA_DIR||path.join(app.getPath('userData'),'sessions'),validateSession,expire);await store.initialize();
 protocol.handle('ayqyn',req=>{const u=new URL(req.url);if(u.host!=='local')return new Response('Forbidden',{status:403});const relative=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);const file=path.resolve(ROOT,'web','.'+relative);if(!file.startsWith(path.join(ROOT,'web')+path.sep))return new Response('Forbidden',{status:403});return net.fetch(pathToFileURL(file).toString());});
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
 handle('init',()=>request('init'));
 handle('consent',value=>{if(typeof value!=='boolean')throw Error('Explicit consent required');if(!value){stop();return false;}cameraConsent=true;return true;});
 handle('infer',async(frame,timestamp)=>{
  if(!cameraConsent)throw Error('Consent required');if(inFlight)return {dropped:true};
  if(typeof frame!=='string'||frame.length>2_000_000||!Number.isSafeInteger(timestamp)||timestamp<=lastTimestamp)throw Error('Invalid frame');
  lastTimestamp=timestamp;inFlight=true;const owned=worker;
  try{const result=await request('infer',{frame,timestamp});if(cameraConsent&&owned===worker)lastObservation=Date.now();return result;}finally{if(owned===worker)inFlight=false;}
 });
 handle('exam',({enabled,fullscreen=false}={})=>{if(typeof enabled!=='boolean'||typeof fullscreen!=='boolean')throw Error('Invalid mode');if(enabled&&(!cameraConsent||Date.now()-lastObservation>1500||!worker))throw Error('Свежие наблюдения и согласие обязательны');active=enabled;win.setFullScreen(enabled&&fullscreen);return {active};});
 handle('stop',()=>{stop();return true;});
 handle('save',s=>store.save(s));handle('load',()=>store.load());handle('delete',()=>store.delete());
 await win.loadURL('ayqyn://local/index.html');
}).catch(e=>{process.stderr.write('AYQYN startup failed: '+e.message+'\n');app.quit();});
app.on('window-all-closed',()=>{stop();app.quit();});app.on('before-quit',stop);

