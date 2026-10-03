import {LocalVision} from './engine.js';
let runtime=null,initializing=null,initialized=null;
window.cvHost.onRequest(async ({id,op,frame,timestamp})=>{
 try{let result;if(op==='init'){runtime??=new LocalVision();initializing??=runtime.initialize();initialized??=await initializing;result=initialized;}else if(op==='infer'){if(!initialized)throw Error('Not initialized');result=await runtime.infer(frame,timestamp);}else throw Error('Unsupported operation');window.cvHost.reply({id,ok:true,result});}
 catch(error){window.cvHost.reply({id,ok:false,error:String(error.message).slice(0,300)});}
});
window.cvHost.ready();
