/** Capture lifecycle only. Dependencies injected so consent races can be tested without a camera. */
export class CaptureGate {
 constructor({api,getMedia,allowed,onStage=()=>{}}){this.api=api;this.getMedia=getMedia;this.allowed=allowed;this.onStage=onStage;this.generation=0;this.stream=null;this.pending=false;}
 async start(){
  if(this.pending||this.stream)return null;
  const token=++this.generation;this.pending=true;const valid=()=>token===this.generation&&this.allowed();
  try{
   if(!valid())throw Error('Согласие отозвано');
   this.onStage('models');this.initialization=await this.api.init();if(!valid())return null;
   await this.api.consent(true);if(!valid()){await this.api.stop();return null;}
   this.onStage('permission');const media=await this.getMedia();
   if(!valid()){media.getTracks().forEach(t=>t.stop());return null;}
   this.stream=media;this.onStage('frames');return media;
  }catch(error){if(!valid())return null;throw error;}finally{if(token===this.generation)this.pending=false;}
 }
 async stop(){++this.generation;this.pending=false;if(this.stream){this.stream.getTracks().forEach(t=>t.stop());this.stream=null;}this.onStage('idle');await this.api.stop();}
}
export class FrameHealth {
 constructor(now){this.started=now;this.lastFrame=null;this.lastFrameAt=now;this.lastObservationAt=null;}
 frame(id,now){if(!Number.isFinite(id)||id===this.lastFrame)return false;this.lastFrame=id;this.lastFrameAt=now;return true;}
 observed(now){this.lastObservationAt=now;}
 failure(now){if(this.lastFrame===null&&now-this.started>8000)return 'Камера не предоставила видеокадры за 8 секунд';if(this.lastFrame!==null&&now-this.lastFrameAt>3000)return 'Видеопоток остановился';if(this.lastObservationAt!==null&&now-this.lastObservationAt>4000)return 'Детектор не возвращает свежие наблюдения';return null;}
 ready(now){return this.lastObservationAt!==null&&now-this.lastObservationAt<=1500&&now-this.lastFrameAt<=1500;}
}
