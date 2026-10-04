const {contextBridge,ipcRenderer}=require('electron');
const on=(channel,cb)=>{const fn=(_e,value)=>cb(value);ipcRenderer.on(channel,fn);return()=>ipcRenderer.removeListener(channel,fn);};
contextBridge.exposeInMainWorld('ayqyn',{
 capabilities:()=>ipcRenderer.invoke('capabilities'),present:()=>ipcRenderer.invoke('ui-present'),retryUi:()=>ipcRenderer.invoke('retry-ui'),init:()=>ipcRenderer.invoke('init'),consent:value=>ipcRenderer.invoke('consent',value),
 infer:(frame,timestamp)=>ipcRenderer.invoke('infer',frame,timestamp),exam:mode=>ipcRenderer.invoke('exam',mode),stop:()=>ipcRenderer.invoke('stop'),
 save:s=>ipcRenderer.invoke('save',s),load:()=>ipcRenderer.invoke('load'),delete:()=>ipcRenderer.invoke('delete'),exportReport:s=>ipcRenderer.invoke('export-report',s),diagnostic:entry=>ipcRenderer.invoke('diagnostic',entry),
 onGuard:cb=>on('guard-event',cb),onEmergency:cb=>on('emergency',cb),onSensorError:cb=>on('sensor-error',cb)
});
