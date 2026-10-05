// Progressive enhancement: only the language preference is stored; no camera, analytics or remote requests.
import {startLocalization} from './locale.js';
await startLocalization();
const steps=document.querySelector('.steps');
const tabs=[...document.querySelectorAll('.step')];
const panels=[...document.querySelectorAll('.panel')];
if(steps&&tabs.length===panels.length){
  steps.setAttribute('role','tablist');
  steps.setAttribute('aria-label','Этапы работы приложения');
  document.querySelector('.panels').classList.add('enhanced');
  const activate=index=>{
    tabs.forEach((tab,i)=>{tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].setAttribute('role','tabpanel');panels[i].tabIndex=0;panels[i].hidden=i!==index;panels[i].classList.remove('reveal');});
    panels[index].classList.add('reveal');
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(index));
    tab.addEventListener('keydown',event=>{
      const keys={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1};
      if(Object.hasOwn(keys,event.key)){event.preventDefault();const next=keys[event.key];activate(next);tabs[next].focus();}
    });
  });
  activate(0);
}
const copy=document.querySelector('#copy-sha');
const status=document.querySelector('#copy-status');
if(copy&&status){
  copy.hidden=false;
  copy.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(document.querySelector('#release-sha').textContent.trim());status.textContent='Хеш скопирован.';}
    catch{status.textContent='Не удалось скопировать. Выделите хеш выше и скопируйте его вручную.';}
  });
}
