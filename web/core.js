export const EVENT_LABELS = {phone:'Устройство в кадре',phone_raised:'Телефон поднят',away:'Возможное отклонение внимания',absent:'Лицо не найдено',second_face:'Второе лицо',quality:'Качество наблюдения',focus:'Выход из окна',clipboard:'Попытка копирования',navigation:'Попытка навигации',interrupted:'Наблюдение прервано'};
export const DEFAULT_POLICY = {dwell:2500, absence:3000, phone:900, cooldown:5000, yaw:24, pitch:18, eye:0.18, retention:24, evidence:false, attention:true};
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function validatePolicy(input){const p={...DEFAULT_POLICY,...input}; for(const [k,min,max] of [['dwell',500,15000],['absence',500,15000],['phone',300,10000],['cooldown',1000,30000],['yaw',10,60],['pitch',10,45],['retention',1,168]]){if(!Number.isFinite(p[k])||p[k]<min||p[k]>max)throw new Error('Недопустимая настройка: '+k);} return p;}
export function validateSession(s){if(!s||s.schema!==1||typeof s.id!=='string'||!Array.isArray(s.events)||s.events.length>10000)throw new Error('Неверный формат сессии'); validatePolicy(s.policy); return s;}
export class EventEngine {
 constructor(policy=DEFAULT_POLICY){this.policy=validatePolicy(policy); this.pending=new Map(); this.last=new Map(); this.clock=-1;}
 reset(){this.pending.clear();this.last.clear();this.clock=-1;}
 ingest(o,t,baseline=null){
  if(!Number.isFinite(t)||t<this.clock)throw new Error('Время должно возрастать');
  if(t-this.clock>1500)this.pending.clear(); this.clock=t;
  const good=o.quality?.usable===true;
  const pose=baseline&&o.pose?Math.abs(o.pose.yaw-baseline.yaw)>this.policy.yaw||o.pose.pitch-baseline.pitch>this.policy.pitch:false;
  const eyes=baseline&&o.eyes&&baseline.eyes?Math.abs(o.eyes.x-baseline.eyes.x)>this.policy.eye||o.eyes.y-baseline.eyes.y>this.policy.eye:false;
  const states={phone:(o.phones?.length??0)>0,phone_raised:(o.phones??[]).some(p=>p.raised===true),away:good&&o.faces===1&&this.policy.attention&&Boolean(pose||eyes),absent:good&&o.faces===0,second_face:good&&o.faces>1,quality:!good};
  const events=[];
  for(const [kind,active] of Object.entries(states)){
   if(!active){this.pending.delete(kind);continue;}
   if(!this.pending.has(kind))this.pending.set(kind,t);
   const dwell=['phone','phone_raised'].includes(kind)?this.policy.phone:kind==='absent'?this.policy.absence:this.policy.dwell;
   if(t-this.pending.get(kind)>=dwell&&t-(this.last.get(kind)??-Infinity)>=this.policy.cooldown){
    this.last.set(kind,t);events.push({id:globalThis.crypto.randomUUID(),kind,at:t,start:this.pending.get(kind),duration:t-this.pending.get(kind),status:'pending',reason:'',observation:structuredClone(o)});
   }
  }
  return events;
 }
}
export function calibration(samples){
 const valid=samples.filter(s=>s.faces===1&&s.quality?.usable&&s.pose&&s.eyes);
 if(valid.length<12)throw new Error('Нужно 12 качественных наблюдений одного лица.');
 const median=xs=>{xs.sort((a,b)=>a-b);return xs[Math.floor(xs.length/2)];};
 const yaw=median(valid.map(s=>s.pose.yaw)),pitch=median(valid.map(s=>s.pose.pitch));
 const spread=Math.max(...valid.map(s=>Math.abs(s.pose.yaw-yaw)));
 if(spread>12)throw new Error('Положение головы меняется. Повторите или отключите оценку внимания.');
 return {yaw,pitch,eyes:{x:median(valid.map(s=>s.eyes.x)),y:median(valid.map(s=>s.eyes.y))},samples:valid.length,spread,at:new Date().toISOString()};
}
export function report(session){validateSession(session); const copy=structuredClone(session); copy.events=copy.events.map(({snapshot,...e})=>e);return {...copy,notice:'Наблюдения для проверки человеком. Не оценка, не доказательство намерения.',exportedAt:new Date().toISOString(),rawImagesIncluded:false};}
export function expire(s,now=Date.now()){return s&&now-Date.parse(s.createdAt)>s.policy.retention*3600000;}
