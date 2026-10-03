const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('cvHost',{onRequest:callback=>ipcRenderer.on('cv-request',(_event,value)=>callback(value)),reply:result=>ipcRenderer.send('cv-response',result),ready:()=>ipcRenderer.send('cv-ready')});
