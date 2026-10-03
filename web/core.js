import {sessionSchema,validDate} from './schema.js';
export const EVENT_LABELS={phone:'Телефон в кадре',phone_raised:'Телефон в верхней части кадра',away:'Возможное отклонение внимания',absent:'Лицо не обнаружено',second_face:'Второе лицо',quality:'Качество изображения',focus:'Выход из окна',clipboard:'Попытка копирования',navigation:'Попытка навигации',interrupted:'Наблюдение прервано'};
export const DEFAULT_POLICY={dwell:2500,absence:3000,phone:900,cooldown:5000,yaw:24,pitch:18,eye:.18,retention:24,evidence:false,attention:true};
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function validatePolicy(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!(k in DEFAULT_POLICY)))throw Error('Неверный формат политики');
 const p={...DEFAULT_POLICY,...input};
 for(const [k,min,max] of [['dwell',500,15000],['absence',500,15000],['phone',300,10000],['cooldown',1000,30000],['yaw',10,60],['pitch',10,45],['eye',.05,.5],['retention',1,168]])if(!Number.isFinite(p[k])||p[k]<min||p[k]>max)throw Error('Недопустимый параметр: '+k);
 for(const k of ['attention','evidence'])if(typeof p[k]!=='boolean')throw Error('Неверный переключатель: '+k);
 return p;
}
export function validateSession(s){return sessionSchema(s,validatePolicy,Object.keys(EVENT_LABELS));}
export class EventEngine{
 constructor(policy=DEFAULT_POLICY){this.policy=validatePolicy(policy);this.pending=new Map();this.last=new Map();this.episodes=new Map();this.clock=-1;}
 reset(){for(const {event} of this.episodes.values()){event.endedAt=Math.max(event.at,this.clock);event.duration=event.endedAt-event.start;}this.pending.clear();this.episodes.clear();this.last.clear();this.clock=-1;}
 ingest(o,t,baseline=null){
  if(!Number.isFinite(t)||t<this.clock)throw Error('Время должно возрастать');
  if(this.clock>=0&&t-this.clock>1500){for(const [kind,{event,lastPositive}] of this.episodes){event.endedAt=Math.max(event.at,lastPositive);event.duration=event.endedAt-event.start;this.last.set(kind,this.clock);}this.pending.clear();this.episodes.clear();}this.clock=t;
  const good=o.quality?.usable===true;
  const pose=baseline&&o.pose?Math.abs(o.pose.yaw-baseline.yaw)>this.policy.yaw||o.pose.pitch-baseline.pitch>this.policy.pitch:false;
  const eyes=baseline&&o.eyes&&baseline.eyes?Math.abs(o.eyes.x-baseline.eyes.x)>this.policy.eye||o.eyes.y-baseline.eyes.y>this.policy.eye:false;
  const states={phone:good&&(o.phones?.length??0)>0,phone_raised:good&&(o.phones??[]).some(p=>p.raised===true),away:good&&o.faces===1&&this.policy.attention&&Boolean(pose||eyes),absent:good&&o.faces===0,second_face:good&&o.faces>1,quality:!good},events=[];
  for(const [kind,positive] of Object.entries(states)){
   const episode=this.episodes.get(kind);
   if(episode){if(positive){episode.lastPositive=t;episode.event.duration=t-episode.event.start;}else if(t-episode.lastPositive>=450){episode.event.endedAt=Math.max(episode.event.at,episode.lastPositive);episode.event.duration=episode.event.endedAt-episode.event.start;this.episodes.delete(kind);this.pending.delete(kind);this.last.set(kind,t);}continue;}
   if(!positive){this.pending.delete(kind);continue;}
   if(!this.pending.has(kind))this.pending.set(kind,t);
   const dwell=['phone','phone_raised'].includes(kind)?this.policy.phone:kind==='absent'?this.policy.absence:this.policy.dwell;
   if(t-this.pending.get(kind)>=dwell&&t-(this.last.get(kind)??-Infinity)>=this.policy.cooldown){const event={id:crypto.randomUUID(),kind,at:t,start:this.pending.get(kind),duration:t-this.pending.get(kind),status:'pending',reason:'',observation:structuredClone(o)};this.episodes.set(kind,{event,lastPositive:t});events.push(event);}
  }
  return events;
 }
}
export function calibration(samples){
 const valid=samples.filter(s=>s.faces===1&&s.quality?.usable&&s.pose&&s.eyes&&[s.pose.yaw,s.pose.pitch,s.eyes.x,s.eyes.y].every(Number.isFinite));
 if(valid.length<12)throw Error('Нужно 12 качественных наблюдений одного лица.');
 const median=xs=>{xs.sort((a,b)=>a-b);return xs[Math.floor(xs.length/2)];};
 const yaw=median(valid.map(s=>s.pose.yaw)),pitch=median(valid.map(s=>s.pose.pitch)),eyes={x:median(valid.map(s=>s.eyes.x)),y:median(valid.map(s=>s.eyes.y))};
 const spread=Math.max(...valid.map(s=>Math.abs(s.pose.yaw-yaw))),pitchSpread=Math.max(...valid.map(s=>Math.abs(s.pose.pitch-pitch))),eyeX=Math.max(...valid.map(s=>Math.abs(s.eyes.x-eyes.x))),eyeY=Math.max(...valid.map(s=>Math.abs(s.eyes.y-eyes.y)));
 if(spread>12||pitchSpread>12||eyeX>.08||eyeY>.12||eyes.x<.1||eyes.x>.9||eyes.y<-.2||eyes.y>1.2)throw Error('Калибровка нестабильна. Посмотрите в центр экрана, расслабьте голову и повторите.');
 return {yaw,pitch,eyes,samples:valid.length,spread:Math.max(spread,pitchSpread),at:new Date().toISOString()};
}
export function report(session){
 validateSession(session);const copy=structuredClone(session);copy.events=copy.events.map(({snapshot,...e})=>e);
 return {...copy,notice:'Наблюдения для проверки человеком. Не оценка и не доказательство нарушения.',exportedAt:new Date().toISOString(),rawImagesIncluded:false};
}
export function expire(s,now=Date.now()){if(!s||!validDate(s.createdAt)||!Number.isFinite(s.policy?.retention)||s.policy.retention<1||s.policy.retention>168||!Number.isFinite(now))return true;return now-Date.parse(s.createdAt)>s.policy.retention*3600000;}
