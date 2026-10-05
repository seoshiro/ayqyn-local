const output=process.env.AYQYN_EVIDENCE_DIR||'artifacts/renderer-regression';
import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
await fs.mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),results=[],errors=[];
try{for(const cancellation of ['stop','revoke','navigation']){
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const state=window.__test={active:false,consent:false,examCalls:0,saved:null,resolveExam:null,stream:null};
  window.ayqyn={capabilities:async()=>({desktop:true,platform:'renderer-mock-test',testSource:'virtual_camera',appBlocked:[],unsupported:[]}),init:async()=>({ready:true}),consent:async value=>{state.consent=value;return value;},stop:async()=>{state.active=false;state.consent=false;return true;},infer:async(_frame,timestamp)=>({faces:1,phones:[],quality:{usable:true},pose:{yaw:0,pitch:0},eyes:{x:.5,y:.5},timestamp,latencyMs:0,source:'rule_fixture',model:'UI lifecycle test fixture; no CV inference'}),exam:async({enabled})=>{state.active=enabled;if(enabled){state.examCalls++;await new Promise(resolve=>state.resolveExam=resolve);}return {active:state.active};},save:async s=>{state.saved=s;},load:async()=>null,delete:async()=>{},onGuard(){},onEmergency(){},onSensorError(){}};
  navigator.mediaDevices.getUserMedia=async()=>{const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const ctx=canvas.getContext('2d');let i=0;const timer=setInterval(()=>{ctx.fillStyle=i++%2?'#333':'#666';ctx.fillRect(0,0,320,240);},100);state.stream=canvas.captureStream(10);state.stream.getVideoTracks()[0].addEventListener('ended',()=>clearInterval(timer));return state.stream;};
 });
 await page.goto(process.env.AYQYN_WEB_URL||'http://127.0.0.1:4173');await page.getByRole('button',{name:'Новая сессия',exact:true}).click();await page.locator('input[name=attention]').uncheck();await page.getByRole('button',{name:'К подготовке'}).click();await page.locator('#consent').check();await page.getByRole('button',{name:'Включить камеру',exact:true}).click();const start=page.getByRole('button',{name:'Начать экзамен',exact:true});await expect(start).toBeEnabled();await start.click();await page.waitForFunction(()=>window.__test.resolveExam!==null);await expect(start).toBeDisabled();
 if(cancellation==='stop')await page.getByRole('button',{name:'Остановить камеру'}).click();else if(cancellation==='revoke')await page.locator('#consent').uncheck();else await page.getByRole('button',{name:'Сессии',exact:true}).click();
 await page.evaluate(()=>window.__test.resolveExam());await page.waitForTimeout(350);
 const result=await page.evaluate(()=>({active:window.__test.active,consent:window.__test.consent,stream:window.__test.stream.active,calls:window.__test.examCalls,status:window.__test.saved?.status,examVisible:document.querySelector('#answer-note')!==null}));
 if(result.active||result.consent||result.stream||result.examVisible||result.status==='active'||result.calls!==1)throw Error('Late exam reply resurrected '+cancellation+': '+JSON.stringify(result));
 results.push({cancellation,...result});await page.close();
}}finally{await browser.close();await fs.writeFile(output+'/renderer-lifecycle-audit.json',JSON.stringify({schema:1,method:'Actual app.js in headless browser with synthetic canvas stream and delayed mocked IPC. No CV accuracy claimed.',results,errors,passed:results.length===3&&errors.length===0},null,2));}
console.log(JSON.stringify(results));

