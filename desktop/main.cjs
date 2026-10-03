const {app,BrowserWindow,ipcMain,protocol,net,session}=require('electron');
const path=require('node:path'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url'),readline=require('node:readline');
const ROOT=path.resolve(__dirname,'..');
if(process.env.AYQYN_TEST==='1'){
 const testData=process.env.AYQYN_DATA_DIR||path.join(ROOT,'data','electron-test');
 app.setPath('userData',testData);app.setPath('sessionData',testData);
 app.disableHardwareAcceleration();
 app.commandLine.appendSwitch('use-fake-device-for-media-stream');
 if(process.env.AYQYN_TEST_VIDEO)app.commandLine.appendSwitch('use-file-for-fake-video-capture',process.env.AYQYN_TEST_VIDEO);
}
protocol.registerSchemesAsPrivileged([{scheme:'ayqyn',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let win,worker,seq=0,active=false,cameraConsent=false,inFlight=false;const pending=new Map();
if(process.env.AYQYN_TEST==='1')app.on('ayqyn-test-crash-worker',()=>worker?.kill());
function trusted(e){if(e.sender!==win?.webContents||e.senderFrame!==win.webContents.mainFrame||!e.senderFrame.url.startsWith('ayqyn://local/'))throw new Error('Untrusted sender');}
function stop(){cameraConsent=false;active=false;if(win){win.setKiosk(false);win.setFullScreen(false);}if(worker){worker.kill();worker=null;}for(const p of pending.values())p.reject(new Error('Worker stopped'));pending.clear();inFlight=false;}
function request(op,payload={}){
 if(!worker){const python=process.env.AYQYN_PYTHON||path.join(ROOT,'.venv',process.platform==='win32'?'Scripts':'bin',process.platform==='win32'?'python.exe':'python');worker=spawn(python,[path.join(ROOT,'cv','worker.py')],{cwd:ROOT,stdio:['pipe','pipe','pipe'],windowsHide:true,shell:false});
 const lines=readline.createInterface({input:worker.stdout});lines.on('line',line=>{try{const r=JSON.parse(line),p=pending.get(r.id);if(p){pending.delete(r.id);r.ok?p.resolve(r.result):p.reject(new Error(r.error));}}catch{}});
 const ownedWorker=worker;worker.stderr.on('data',()=>{});worker.on('error',e=>{if(worker===ownedWorker)failure(e);});worker.on('exit',()=>{if(worker===ownedWorker)failure(new Error('CV worker exited'));});
 }
 return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(new Error('CV timeout'));},30000);pending.set(id,{resolve:r=>{clearTimeout(t);resolve(r);},reject:e=>{clearTimeout(t);reject(e);}});worker.stdin.write(JSON.stringify({id,op,...payload})+'\n');});
}
function failure(e){for(const p of pending.values())p.reject(e);pending.clear();worker=null;win?.webContents.send('sensor-error','Наблюдение остановлено. Проверьте локальные модели.');}
app.whenReady().then(async()=>{
 protocol.handle('ayqyn',req=>{const u=new URL(req.url);if(u.host!=='local')return new Response('Forbidden',{status:403});const relative=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);const file=path.resolve(ROOT,'web','.'+relative);if(!file.startsWith(path.join(ROOT,'web')+path.sep))return new Response('Forbidden',{status:403});return net.fetch(pathToFileURL(file).toString());});
 win=new BrowserWindow({width:1420,height:940,minWidth:800,minHeight:650,title:'AYQYN · Local',backgroundColor:'#f3f6f7',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,devTools:process.env.AYQYN_TEST==='1'}});
 session.defaultSession.setPermissionCheckHandler((wc,permission,origin,details)=>wc===win.webContents&&origin.startsWith('ayqyn://local')&&permission==='media'&&cameraConsent&&(!details.mediaType||details.mediaType==='video'));
 session.defaultSession.setPermissionRequestHandler((wc,permission,callback,details)=>callback(wc===win.webContents&&permission==='media'&&cameraConsent&&details.mediaTypes?.every(t=>t==='video')));
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
 handle('consent',value=>{if(value!==true)throw new Error('Explicit consent required');cameraConsent=true;return true;});
 handle('infer',async(frame,timestamp)=>{if(!cameraConsent)throw new Error('Consent required');if(inFlight)return {dropped:true};if(typeof frame!=='string'||frame.length>2_000_000||!Number.isSafeInteger(timestamp))throw new Error('Invalid frame');inFlight=true;try{return await request('infer',{frame,timestamp});}finally{inFlight=false;}});
 handle('exam',({enabled,fullscreen=false})=>{if(typeof enabled!=='boolean'||typeof fullscreen!=='boolean')throw new Error('Invalid mode');active=enabled;win.setFullScreen(enabled&&fullscreen);return {active};});
 handle('stop',()=>{stop();return true;});
 const dataDir=process.env.AYQYN_DATA_DIR||path.join(app.getPath('userData'),'sessions');
 const file=path.join(dataDir,'current.json');
 handle('save',async s=>{const text=JSON.stringify(s);if(text.length>12_000_000||s?.schema!==1||typeof s.id!=='string'||!Array.isArray(s.events))throw new Error('Invalid session');await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(file+'.tmp',text,{mode:0o600});await fs.rename(file+'.tmp',file);return true;});
 handle('load',async()=>{try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw new Error('Не удалось прочитать сессию');}});
 handle('delete',async()=>{await fs.rm(file,{force:true});return true;});
 await win.loadURL('ayqyn://local/index.html');
});
app.on('window-all-closed',()=>{stop();app.quit();});app.on('before-quit',stop);
